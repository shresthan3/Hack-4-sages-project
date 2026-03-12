import math
import pandas as pd
import requests
from io import StringIO
from urllib.parse import quote_plus

# Reuse your existing stellar helpers
from ModelGen import compute_luminosity, compute_habitable_zone


# ============================================================
# CONSTANTS
# ============================================================
MU0 = 4.0 * math.pi * 1e-7          # Vacuum permeability [H/m]
F0 = 1.16                           # Magnetopause form factor
P_SW_EARTH = 2.0e-9                 # Solar-wind dynamic pressure at Earth [Pa]
R_EARTH_M = 6.371e6                 # Earth radius [m]

EARTH_DENSITY = 5.51                # g/cm^3
JUPITER_RADIUS_RE = 11.209          # Jupiter radius in Earth radii
JUPITER_MASS_ME = 317.83            # Jupiter mass in Earth masses

MU_DIP_EARTH = 7.8e22               # Earth magnetic dipole moment [A m^2]
MU_DIP_JUPITER = 1.56e27            # Jupiter magnetic dipole moment [A m^2]


# ============================================================
# NASA QUERY
# ============================================================
def get_magnetosphere_data_for_star(hostname):
    """
    Query the NASA Exoplanet Archive for one host star and
    return only the fields needed for the magnetosphere model.
    """
    safe_name = hostname.replace("'", "''")

    query = f"""
    select
        pl_name,
        hostname,
        st_mass,
        st_rad,
        st_teff,
        st_lum,
        st_age,
        st_spectype,
        pl_orbper,
        pl_orbsmax,
        pl_bmasse,
        pl_rade,
        pl_dens
    from pscomppars
    where hostname = '{safe_name}'
    order by pl_orbsmax
    """

    url = (
        "https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query="
        + quote_plus(query)
        + "&format=csv"
    )

    response = requests.get(url, timeout=60)
    response.raise_for_status()
    return pd.read_csv(StringIO(response.text))


# ============================================================
# FORMATTING HELPERS
# ============================================================
def format_value(value, decimals=3, suffix=""):
    if value is None or pd.isna(value):
        return "Not enough data"
    return f"{value:.{decimals}f}{suffix}"


def format_scientific(value):
    if value is None or pd.isna(value):
        return "Not enough data"
    return f"{value:.3e}"


def print_intro():
    print("=" * 74)
    print("EXOPLANET MAGNETOSPHERE CALCULATOR")
    print("=" * 74)
    print()
    print("What this tool does:")
    print("- You enter one HOST STAR name")
    print("- The program finds all planets orbiting that star")
    print("- It estimates each planet's magnetic shielding strength")
    print("- It prints only magnetosphere-related output")
    print()
    print("What the results mean:")
    print("- Larger magnetopause size usually means better magnetic shielding")
    print("- Magnetopause size is shown in planet radii (Rp)")
    print("- A value around 8 to 10 Rp is strong shielding")
    print("- Very small values mean the magnetosphere may be compressed")
    print()
    print("Examples of valid host star names:")
    print("  TRAPPIST-1")
    print("  Kepler-62")
    print("  Kepler-442")
    print("  Proxima Centauri")
    print()


def print_explainer():
    print("\n" + "-" * 74)
    print("COLUMN GUIDE")
    print("-" * 74)
    print("Planet type            = rough classification used in the model")
    print("Orbit (AU)             = planet's orbital distance from the star")
    print("Orbital period (days)  = length of its year")
    print("Rotation used (hours)  = estimated spin period used in calculation")
    print("Wind pressure (Pa)     = estimated stellar-wind pressure at the planet")
    print("Dipole moment          = estimated planetary magnetic dipole strength")
    print("Surface field (uT)     = estimated surface magnetic field strength")
    print("Magnetopause (Rp)      = estimated standoff distance in planet radii")
    print("Shielding              = simple interpretation of magnetic protection")
    print("-" * 74)


# ============================================================
# CLASSIFICATION HELPERS
# ============================================================
def spectral_family(st_spectype):
    if pd.isna(st_spectype):
        return None

    text = str(st_spectype).strip().upper()
    for ch in text:
        if ch in ["F", "G", "K", "M"]:
            return ch
    return None


def classify_planet_type(radius_re, mass_me, density_gcc):
    """
    Very simple planet-type classification for magnetic scaling.
    """
    if pd.notna(density_gcc):
        if density_gcc >= 3.5:
            return "Rocky / terrestrial"
        return "Gas / ice giant"

    if pd.notna(radius_re):
        if radius_re <= 1.8:
            return "Rocky / terrestrial"
        if radius_re >= 3.0:
            return "Gas / ice giant"

    if pd.notna(mass_me):
        if mass_me <= 10.0:
            return "Rocky / terrestrial"
        if mass_me >= 30.0:
            return "Gas / ice giant"

    return "Rocky / terrestrial"


# ============================================================
# MODEL HELPERS
# ============================================================
def infer_rotation_period_hours(row, hz_inner, hz_outer):
    """
    Estimate a rotation period in hours.

    Logic:
    - Very close planets are assumed tidally locked
    - HZ planets around cool stars may also be tidally locked
    - Otherwise use simple baseline values
    """
    a = row["pl_orbsmax"]
    orbital_period_days = row["pl_orbper"]
    family = spectral_family(row["st_spectype"])
    planet_type = classify_planet_type(row["pl_rade"], row["pl_bmasse"], row["pl_dens"])

    likely_locked = False

    if pd.notna(a) and pd.notna(orbital_period_days):
        if a <= 0.15:
            likely_locked = True
        elif family in ["M", "K"] and hz_inner is not None and hz_outer is not None:
            if hz_inner <= a <= hz_outer:
                likely_locked = True

    if likely_locked and pd.notna(orbital_period_days):
        return orbital_period_days * 24.0, "Assumed tidally locked"

    if planet_type == "Gas / ice giant":
        return 10.0, "Used giant-planet baseline"
    return 24.0, "Used Earth-like baseline"


def estimate_dipole_moment(row, rotation_hours):
    """
    Estimate planetary magnetic dipole moment [A m^2].
    This is a heuristic scaling for hackathon/demo use.
    """
    radius_re = row["pl_rade"]
    mass_me = row["pl_bmasse"]
    density = row["pl_dens"]

    planet_type = classify_planet_type(radius_re, mass_me, density)

    if pd.isna(radius_re) or radius_re <= 0:
        return None, planet_type

    if pd.isna(density) or density <= 0:
        density = EARTH_DENSITY if planet_type == "Rocky / terrestrial" else 1.33

    if pd.isna(mass_me) or mass_me <= 0:
        if planet_type == "Rocky / terrestrial":
            mass_me = max(0.3, radius_re ** 3)
        else:
            mass_me = max(30.0, (radius_re / JUPITER_RADIUS_RE) ** 3 * JUPITER_MASS_ME)

    spin_factor = math.sqrt(max(0.05, 24.0 / max(rotation_hours, 1.0)))

    if planet_type == "Rocky / terrestrial":
        density_factor = math.sqrt(max(0.1, density / EARTH_DENSITY))
        radius_factor = radius_re ** 3
        mu = MU_DIP_EARTH * density_factor * radius_factor * spin_factor
    else:
        radius_rj = radius_re / JUPITER_RADIUS_RE
        mass_mj = mass_me / JUPITER_MASS_ME
        giant_spin_factor = math.sqrt(max(0.05, 10.0 / max(rotation_hours, 1.0)))
        mu = MU_DIP_JUPITER * (max(0.2, radius_rj) ** 3) * (max(0.1, mass_mj) ** 0.2) * giant_spin_factor

    return mu, planet_type


def estimate_stellar_wind_pressure(a_au, st_age_gyr):
    """
    First-order stellar-wind dynamic pressure [Pa].
    Scales as 1 / a^2 and includes a simple stellar-age factor.
    """
    if pd.isna(a_au) or a_au <= 0:
        return None

    pressure = P_SW_EARTH / (a_au ** 2)

    if pd.notna(st_age_gyr) and st_age_gyr > 0:
        age_factor = (4.6 / st_age_gyr) ** 0.7
        age_factor = min(max(age_factor, 0.4), 8.0)
        pressure *= age_factor

    return pressure


def magnetopause_standoff_distance(mu_dipole, p_sw):
    """
    Magnetopause standoff distance [m] from dipole-pressure balance.
    """
    if mu_dipole is None or p_sw is None or p_sw <= 0:
        return None

    numerator = MU0 * (F0 ** 2) * (mu_dipole ** 2)
    denominator = 8.0 * (math.pi ** 2) * p_sw
    return (numerator / denominator) ** (1.0 / 6.0)


def surface_equatorial_field(mu_dipole, radius_re):
    """
    Equatorial surface magnetic field [Tesla].
    """
    if mu_dipole is None or pd.isna(radius_re) or radius_re <= 0:
        return None

    radius_m = radius_re * R_EARTH_M
    return MU0 * mu_dipole / (4.0 * math.pi * radius_m ** 3)


def shielding_label(rmp_over_rp):
    """
    Simple readable magnetosphere interpretation.
    """
    if rmp_over_rp is None or pd.isna(rmp_over_rp):
        return "Not enough data"
    if rmp_over_rp <= 1.0:
        return "Very exposed"
    if rmp_over_rp <= 2.0:
        return "Extremely compressed"
    if rmp_over_rp <= 5.0:
        return "Compressed"
    if rmp_over_rp <= 8.0:
        return "Moderate shielding"
    return "Strong shielding"


# ============================================================
# CORE CALCULATION
# ============================================================
def build_magnetosphere_report(df):
    first = df.iloc[0]

    luminosity = compute_luminosity(first["st_rad"], first["st_teff"], first["st_lum"])
    hz_inner, hz_outer = compute_habitable_zone(luminosity)

    star_info = {
        "hostname": first["hostname"],
        "spectral_type": first["st_spectype"],
        "stellar_mass": first["st_mass"],
        "stellar_age": first["st_age"],
        "luminosity": luminosity,
        "hz_inner": hz_inner,
        "hz_outer": hz_outer,
    }

    planet_rows = []

    for _, row in df.iterrows():
        rotation_hours, rotation_note = infer_rotation_period_hours(row, hz_inner, hz_outer)
        dipole_moment, planet_type = estimate_dipole_moment(row, rotation_hours)
        wind_pressure = estimate_stellar_wind_pressure(row["pl_orbsmax"], row["st_age"])
        standoff_m = magnetopause_standoff_distance(dipole_moment, wind_pressure)
        beq_t = surface_equatorial_field(dipole_moment, row["pl_rade"])

        if standoff_m is not None and pd.notna(row["pl_rade"]) and row["pl_rade"] > 0:
            planet_radius_m = row["pl_rade"] * R_EARTH_M
            standoff_rp = standoff_m / planet_radius_m
        else:
            standoff_rp = None

        planet_rows.append({
            "Planet": row["pl_name"],
            "Planet type": planet_type,
            "Orbit (AU)": row["pl_orbsmax"],
            "Orbital period (days)": row["pl_orbper"],
            "Rotation used (hours)": rotation_hours,
            "Rotation assumption": rotation_note,
            "Wind pressure (Pa)": wind_pressure,
            "Dipole moment (A m^2)": dipole_moment,
            "Surface field (uT)": None if beq_t is None else beq_t * 1e6,
            "Magnetopause (Rp)": standoff_rp,
            "Shielding": shielding_label(standoff_rp),
        })

    return star_info, pd.DataFrame(planet_rows)


# ============================================================
# OUTPUT
# ============================================================
def print_star_summary(star_info):
    print("\n" + "=" * 74)
    print(f"HOST STAR: {star_info['hostname']}")
    print("=" * 74)
    print(f"Spectral type: {star_info['spectral_type'] if pd.notna(star_info['spectral_type']) else 'Not enough data'}")
    print(f"Stellar mass: {format_value(star_info['stellar_mass'], 3, ' M_sun')}")
    print(f"Stellar age: {format_value(star_info['stellar_age'], 3, ' Gyr')}")
    print(f"Luminosity: {format_value(star_info['luminosity'], 3, ' L_sun')}")

    if star_info["hz_inner"] is not None and star_info["hz_outer"] is not None:
        print(f"Habitable zone: {star_info['hz_inner']:.3f} AU to {star_info['hz_outer']:.3f} AU")
    else:
        print("Habitable zone: Not enough data")


def print_planet_report(report_df):
    print("\n" + "=" * 74)
    print("PLANET MAGNETOSPHERE RESULTS")
    print("=" * 74)

    for i, (_, row) in enumerate(report_df.iterrows(), start=1):
        print(f"\nPlanet {i}: {row['Planet']}")
        print("-" * 74)
        print(f"Type: {row['Planet type']}")
        print(f"Orbit distance: {format_value(row['Orbit (AU)'], 3, ' AU')}")
        print(f"Orbital period: {format_value(row['Orbital period (days)'], 3, ' days')}")
        print(f"Rotation used: {format_value(row['Rotation used (hours)'], 3, ' hours')}")
        print(f"Rotation assumption: {row['Rotation assumption']}")
        print(f"Estimated stellar-wind pressure: {format_scientific(row['Wind pressure (Pa)'])} Pa")
        print(f"Estimated dipole moment: {format_scientific(row['Dipole moment (A m^2)'])} A m^2")
        print(f"Estimated surface field: {format_value(row['Surface field (uT)'], 3, ' uT')}")
        print(f"Magnetopause standoff distance: {format_value(row['Magnetopause (Rp)'], 3, ' Rp')}")
        print(f"Shielding interpretation: {row['Shielding']}")


def print_final_note():
    print("\n" + "=" * 74)
    print("IMPORTANT NOTE")
    print("=" * 74)
    print("These magnetosphere values are first-order estimates.")
    print("They are useful for comparing planets in a hackathon project,")
    print("but they are not direct measurements of real exoplanet magnetic fields.")


# ============================================================
# MAIN
# ============================================================
def main():
    print_intro()

    star_name = input("Enter host star name: ").strip()

    if not star_name:
        print("Please enter a valid host star name.")
        return

    try:
        df = get_magnetosphere_data_for_star(star_name)

        if df.empty:
            print("\nNo planets were found for that host star.")
            print("Check the spelling and try again.")
            return

        star_info, report_df = build_magnetosphere_report(df)

        print_star_summary(star_info)
        print_explainer()
        print_planet_report(report_df)
        print_final_note()

    except requests.exceptions.HTTPError:
        print("\nThere was a problem contacting the NASA Exoplanet Archive.")
    except requests.exceptions.RequestException:
        print("\nThere was a network problem while loading the data.")
    except Exception as exc:
        print("\nSomething unexpected went wrong.")
        print(exc)


if __name__ == "__main__":
    main()