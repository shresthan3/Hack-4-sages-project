import math
import pandas as pd
import requests
from urllib.parse import quote_plus
from io import StringIO

# ============================================================
# CONSTANTS
# ============================================================
T_SUN = 5778  # Kelvin
HZ_INNER_SOLAR = 0.99   # AU
HZ_OUTER_SOLAR = 1.70   # AU

# Earth reference values
EARTH_ORBIT = 1.000
EARTH_DENSITY = 5.51
EARTH_ECC = 0.0167
EARTH_INSOL = 1.00
EARTH_EQT = 255.0
EARTH_RADIUS = 1.00
EARTH_MASS = 1.00


# ============================================================
# DATA QUERY
# ============================================================
def get_planets_for_star(hostname):
    """
    Query NASA Exoplanet Archive PSCompPars table for all planets
    orbiting a given host star.
    """
    query = f"""
    select pl_name, hostname, st_rad, st_teff, st_spectype, st_lum, st_age, st_met,
           pl_orbsmax, pl_dens, pl_orbeccen, pl_insol, pl_eqt, pl_rade, pl_bmasse,
           sy_dist, discoverymethod, disc_year, sy_snum, sy_pnum, cb_flag
    from pscomppars
    where hostname = '{hostname}'
    """

    base_url = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query="
    full_url = base_url + quote_plus(query) + "&format=csv"

    response = requests.get(full_url, timeout=30)
    response.raise_for_status()

    return pd.read_csv(StringIO(response.text))


# ============================================================
# HELPER FUNCTIONS
# ============================================================
def compute_luminosity(st_rad, st_teff, st_lum):
    """
    Use archive stellar luminosity if available.
    st_lum is log10(L/Lsun), so convert with 10 ** st_lum.
    Otherwise compute from stellar radius and temperature.
    """
    if pd.notna(st_lum):
        return 10 ** st_lum

    if pd.isna(st_rad) or pd.isna(st_teff):
        return None

    return (st_rad ** 2) * ((st_teff / T_SUN) ** 4)


def compute_habitable_zone(luminosity):
    """
    Scale the conservative solar habitable zone by sqrt(L).
    """
    if luminosity is None:
        return None, None

    hz_inner = HZ_INNER_SOLAR * math.sqrt(luminosity)
    hz_outer = HZ_OUTER_SOLAR * math.sqrt(luminosity)
    return hz_inner, hz_outer


def yes_no_goldilocks(pl_orbsmax, hz_inner, hz_outer):
    """
    Check whether the planet's semi-major axis lies within the habitable zone.
    """
    if pd.isna(pl_orbsmax) or hz_inner is None or hz_outer is None:
        return "Not enough data"
    if hz_inner <= pl_orbsmax <= hz_outer:
        return "YES"
    return "NO"


def rocky_note(density, radius, mass):
    """
    Rough composition estimate using density, then radius, then mass.
    """
    if pd.notna(density):
        if density >= 5.0:
            return "likely rocky"
        if density >= 3.5:
            return "possibly rocky"
        return "likely gaseous/icy"

    if pd.notna(radius):
        if radius <= 1.6:
            return "radius suggests rocky candidate"
        if radius <= 2.5:
            return "radius suggests possible mini-Neptune"
        return "radius suggests gaseous planet"

    if pd.notna(mass):
        if mass <= 10:
            return "mass could fit rocky/super-Earth range"
        return "mass suggests large planet"

    return "Not enough data"


def eccentricity_note(ecc):
    if pd.isna(ecc):
        return "Not enough data"
    if ecc < 0.2:
        return "orbit fairly circular"
    if ecc < 0.4:
        return "orbit somewhat eccentric"
    return "orbit highly eccentric"


def spectral_type_note(st_spectype):
    if pd.isna(st_spectype) or str(st_spectype).strip() == "":
        return "Not enough data"
    return str(st_spectype).strip()


def classify_star_from_spectype(st_spectype):
    """
    Convert spectral type into a simple readable class.
    Example: G2V -> G-type dwarf / main-sequence star
    """
    if pd.isna(st_spectype) or str(st_spectype).strip() == "":
        return "Not enough data"

    s = str(st_spectype).strip().upper()

    spectral_letter = None
    for ch in s:
        if ch in ["O", "B", "A", "F", "G", "K", "M"]:
            spectral_letter = ch
            break

    if spectral_letter is None:
        return "Not enough data"

    luminosity_class = None
    if "VII" in s:
        luminosity_class = "white dwarf"
    elif "VI" in s:
        luminosity_class = "subdwarf"
    elif "IV" in s:
        luminosity_class = "subgiant"
    elif "III" in s:
        luminosity_class = "giant"
    elif "II" in s:
        luminosity_class = "bright giant"
    elif "IA" in s or "IB" in s or "I" in s:
        luminosity_class = "supergiant"
    elif "V" in s:
        if spectral_letter == "M":
            luminosity_class = "dwarf / red dwarf"
        else:
            luminosity_class = "dwarf / main-sequence star"

    if luminosity_class is None:
        return f"{spectral_letter}-type star"

    return f"{spectral_letter}-type {luminosity_class}"


def format_value(value, decimals=3, suffix=""):
    if pd.isna(value):
        return "Not enough data"
    return f"{value:.{decimals}f}{suffix}"


def circumbinary_note(cb_flag):
    if pd.isna(cb_flag):
        return "Not enough data"
    return "Yes" if int(cb_flag) == 1 else "No"


def compute_esi(radius, temperature):
    """
    Compute the 2-parameter Earth Similarity Index (ESI)
    using planet radius and equilibrium temperature.

    ESI = sqrt[(1 - |(Rp - Re)/(Rp + Re)|) * (1 - |(Tp - Te)/(Tp + Te)|)]
    """
    RE = 1.0      # Earth radius in Earth radii
    TE = 255.0    # Earth equilibrium temperature in K

    if pd.isna(radius) or pd.isna(temperature):
        return None

    if (radius + RE) == 0 or (temperature + TE) == 0:
        return None

    radius_term = 1 - abs((radius - RE) / (radius + RE))
    temp_term = 1 - abs((temperature - TE) / (temperature + TE))

    return math.sqrt(radius_term * temp_term)


def esi_note(esi):
    if esi is None:
        return "Not enough data"
    if esi >= 0.90:
        return "very Earth-like by this ESI model"
    if esi >= 0.80:
        return "fairly Earth-like by this ESI model"
    if esi >= 0.70:
        return "somewhat Earth-like by this ESI model"
    return "not very Earth-like by this ESI model"


# ============================================================
# PRINT FUNCTIONS
# ============================================================
def print_instructions():
    print("=" * 60)
    print("NASA EXOPLANET ARCHIVE GOLDILOCKS ZONE CALCULATOR")
    print("=" * 60)
    print()
    print("How to use this calculator:")
    print("1. Type a HOST STAR name exactly as it appears in the dataset.")
    print("2. Do NOT type the planet name.")
    print("3. The calculator will find all planets orbiting that star.")
    print("4. It will calculate the habitable zone and say if each planet is in it.")
    print("5. It will also calculate the Earth Similarity Index (ESI).")
    print()
    print("Examples of valid star inputs:")
    print("  Kepler-442")
    print("  TRAPPIST-1")
    print("  Kepler-62")
    print("  Kepler-69")
    print("  GJ 3470")
    print()
    print("Example:")
    print("  Correct input: Kepler-442")
    print("  Wrong input:   Kepler-442 b")
    print()


def print_earth_sun_reference():
    sun_luminosity = 1.000
    sun_hz_inner = HZ_INNER_SOLAR
    sun_hz_outer = HZ_OUTER_SOLAR
    earth_result = yes_no_goldilocks(EARTH_ORBIT, sun_hz_inner, sun_hz_outer)
    earth_esi = compute_esi(EARTH_RADIUS, EARTH_EQT)

    print("\n" + "=" * 60)
    print("SUN–EARTH REFERENCE")
    print("=" * 60)

    print("STAR DATA")
    print("  Name: Sun")
    print("  Spectral type: G2V")
    print("  Star class: G-type dwarf / main-sequence star")
    print(f"  Stellar luminosity: {sun_luminosity:.3f} L_sun")
    print(f"  Habitable zone: {sun_hz_inner:.3f} AU to {sun_hz_outer:.3f} AU")
    print("  Stellar age: 4.600 Gyr")
    print("  Stellar metallicity: ~0.000 dex")
    print("  System distance: 0.000 pc")
    print("  Number of stars in system: 1")
    print("  Number of planets in system: 8")
    print("  Circumbinary system? No")

    print("\nPLANET DATA")
    print("  Name: Earth")
    print(f"  Orbit distance: {EARTH_ORBIT:.3f} AU")
    print(f"  Insolation flux: {EARTH_INSOL:.2f} Earth flux")
    print(f"  Equilibrium temperature: {EARTH_EQT:.1f} K")
    print(f"  Planet radius: {EARTH_RADIUS:.2f} Earth radii")
    print(f"  Planet mass: {EARTH_MASS:.2f} Earth masses")
    print(f"  In Goldilocks zone? {earth_result}")
    print(f"  Earth Similarity Index (ESI): {earth_esi:.3f}")
    print(f"  ESI note: {esi_note(earth_esi)}")
    print(f"  Composition note: {rocky_note(EARTH_DENSITY, EARTH_RADIUS, EARTH_MASS)}")
    print(f"  Orbit note: {eccentricity_note(EARTH_ECC)}")
    print("  Discovery method: historical / direct human observation")
    print("  Discovery year: Not applicable")


def print_star_section(df, star_name):
    first_row = df.iloc[0]

    st_rad = first_row["st_rad"]
    st_teff = first_row["st_teff"]
    st_spectype = first_row["st_spectype"]
    st_lum = first_row["st_lum"]
    st_age = first_row["st_age"]
    st_met = first_row["st_met"]
    sy_dist = first_row["sy_dist"]
    sy_snum = first_row["sy_snum"]
    sy_pnum = first_row["sy_pnum"]
    cb_flag = first_row["cb_flag"]

    luminosity = compute_luminosity(st_rad, st_teff, st_lum)
    hz_inner, hz_outer = compute_habitable_zone(luminosity)

    print("\n" + "=" * 60)
    print(f"SYSTEM: {star_name}")
    print("=" * 60)

    print("STAR DATA")
    print(f"  Name: {star_name}")
    print(f"  Spectral type: {spectral_type_note(st_spectype)}")
    print(f"  Star class: {classify_star_from_spectype(st_spectype)}")
    print(f"  Stellar luminosity: {format_value(luminosity, 3, ' L_sun')}")
    print(f"  Stellar radius: {format_value(st_rad, 3, ' solar radii')}")
    print(f"  Stellar temperature: {format_value(st_teff, 1, ' K')}")
    if hz_inner is not None and hz_outer is not None:
        print(f"  Habitable zone: {hz_inner:.3f} AU to {hz_outer:.3f} AU")
    else:
        print("  Habitable zone: Not enough data")
    print(f"  Stellar age: {format_value(st_age, 3, ' Gyr')}")
    print(f"  Stellar metallicity: {format_value(st_met, 3, ' dex')}")
    print(f"  System distance: {format_value(sy_dist, 3, ' pc')}")
    print(f"  Number of stars in system: {int(sy_snum) if pd.notna(sy_snum) else 'Not enough data'}")
    print(f"  Number of planets in system: {int(sy_pnum) if pd.notna(sy_pnum) else 'Not enough data'}")
    print(f"  Circumbinary system? {circumbinary_note(cb_flag)}")

    return hz_inner, hz_outer


def print_planet_section(row, hz_inner, hz_outer, planet_number=None):
    planet_name = row["pl_name"]
    pl_orbsmax = row["pl_orbsmax"]
    pl_dens = row["pl_dens"]
    pl_orbeccen = row["pl_orbeccen"]
    pl_insol = row["pl_insol"]
    pl_eqt = row["pl_eqt"]
    pl_rade = row["pl_rade"]
    pl_bmasse = row["pl_bmasse"]
    discoverymethod = row["discoverymethod"]
    disc_year = row["disc_year"]

    goldilocks = yes_no_goldilocks(pl_orbsmax, hz_inner, hz_outer)
    esi = compute_esi(pl_rade, pl_eqt)

    print(f"\nPLANET {planet_number}" if planet_number is not None else "\nPLANET")
    print(f"  Name: {planet_name}")
    print(f"  Orbit distance: {format_value(pl_orbsmax, 3, ' AU')}")
    print(f"  Insolation flux: {format_value(pl_insol, 3, ' Earth flux')}")
    print(f"  Equilibrium temperature: {format_value(pl_eqt, 1, ' K')}")
    print(f"  Planet radius: {format_value(pl_rade, 3, ' Earth radii')}")
    print(f"  Planet mass: {format_value(pl_bmasse, 3, ' Earth masses')}")
    print(f"  In Goldilocks zone? {goldilocks}")

    if esi is not None:
        print(f"  Earth Similarity Index (ESI): {esi:.3f}")
    else:
        print("  Earth Similarity Index (ESI): Not enough data")

    print(f"  ESI note: {esi_note(esi)}")
    print(f"  Composition note: {rocky_note(pl_dens, pl_rade, pl_bmasse)}")
    print(f"  Orbit eccentricity: {format_value(pl_orbeccen, 3, '')}")
    print(f"  Orbit note: {eccentricity_note(pl_orbeccen)}")
    print(f"  Discovery method: {discoverymethod if pd.notna(discoverymethod) else 'Not enough data'}")
    print(f"  Discovery year: {int(disc_year) if pd.notna(disc_year) else 'Not enough data'}")


# ============================================================
# MAIN PROGRAM
# ============================================================
def main():
    print_instructions()
    print_earth_sun_reference()

    while True:
        star_name = input("\nEnter the host star name here: ").strip()

        if star_name == "":
            print("Please type a star name.")
            continue

        try:
            df = get_planets_for_star(star_name)

            if df.empty:
                print("\nNo planets found for that star name in the dataset.")
                print("Check spelling, spaces, and punctuation, then try again.")
                continue

            hz_inner, hz_outer = print_star_section(df, star_name)

            print("\nPLANET DATA")
            for i, (_, row) in enumerate(df.iterrows(), start=1):
                print_planet_section(row, hz_inner, hz_outer, i)

            again = input("\nWould you like to check another star? (yes/no): ").strip().lower()
            if again not in ["yes", "y"]:
                print("\nCalculator closed.")
                break

        except requests.exceptions.HTTPError as exc:
            print("\nHTTP error while contacting the NASA Exoplanet Archive.")
            print(exc)
            break

        except requests.exceptions.RequestException as exc:
            print("\nNetwork error while contacting the NASA Exoplanet Archive.")
            print(exc)
            break

        except Exception as exc:
            print("\nSomething went wrong.")
            print(exc)
            break


if __name__ == "__main__":
    main()