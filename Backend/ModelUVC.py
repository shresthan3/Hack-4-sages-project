import numpy as np
import pandas as pd
import requests
from io import StringIO
from urllib.parse import quote_plus

# ============================================================
# LOAD NASA DATA FOR ONE STAR
# ============================================================
def get_planets_for_star(hostname):
    query = f"""
    select pl_name, hostname, pl_orbsmax, st_teff, st_lum, st_age, st_met, st_spectype
    from pscomppars
    where hostname = '{hostname}'
    """
    url = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=" + quote_plus(query) + "&format=csv"
    response = requests.get(url, timeout=60)
    response.raise_for_status()
    return pd.read_csv(StringIO(response.text))


# ============================================================
# UV TEMPLATES
# Placeholder template curves for UVC estimate
# Replace later with real MUSCLES / HAZMAT spectra if needed
# ============================================================
def make_uv_templates():
    wavelengths = np.linspace(100, 400, 1000)

    templates = {
        "M": {
            "name": "M-type template",
            "d_ref_au": 1.0,
            "wavelength_nm": wavelengths,
            "flux_ref": 1e-5 * np.exp(-((wavelengths - 250) / 80) ** 2)
        },
        "K": {
            "name": "K-type template",
            "d_ref_au": 1.0,
            "wavelength_nm": wavelengths,
            "flux_ref": 3e-5 * np.exp(-((wavelengths - 220) / 70) ** 2)
        },
        "G": {
            "name": "G-type template",
            "d_ref_au": 1.0,
            "wavelength_nm": wavelengths,
            "flux_ref": 8e-5 * np.exp(-((wavelengths - 200) / 60) ** 2)
        },
        "F": {
            "name": "F-type template",
            "d_ref_au": 1.0,
            "wavelength_nm": wavelengths,
            "flux_ref": 2e-4 * np.exp(-((wavelengths - 180) / 50) ** 2)
        },
    }
    return templates


# ============================================================
# HELPER FUNCTIONS
# ============================================================
def spectral_family(st_spectype):
    if pd.isna(st_spectype):
        return None

    text = str(st_spectype).strip().upper()
    for char in text:
        if char in ["F", "G", "K", "M"]:
            return char
    return None


def choose_template(st_spectype, st_teff, templates):
    family = spectral_family(st_spectype)

    if family in templates:
        return templates[family]

    if pd.notna(st_teff):
        if st_teff >= 6000:
            return templates["F"]
        elif st_teff >= 5200:
            return templates["G"]
        elif st_teff >= 3700:
            return templates["K"]
        else:
            return templates["M"]

    return templates["G"]


def compute_uvc_flux(template, orbital_distance_au, st_lum):
    if pd.isna(orbital_distance_au) or orbital_distance_au <= 0:
        return None

    wavelengths = template["wavelength_nm"]
    flux_ref = template["flux_ref"]
    d_ref = template["d_ref_au"]

    # Scale template to planet orbit
    flux_at_planet = flux_ref * (d_ref / orbital_distance_au) ** 2

    # Scale by stellar luminosity if available
    if pd.notna(st_lum):
        luminosity = 10 ** st_lum
        flux_at_planet = flux_at_planet * luminosity

    # Integrate UVC band: 100–280 nm
    mask = (wavelengths >= 100) & (wavelengths <= 280)
    if mask.sum() < 2:
        return None

    return np.trapezoid(flux_at_planet[mask], wavelengths[mask])


def classify_uvc(uvc_flux, low_threshold=0.001, high_threshold=0.01):
    if uvc_flux is None or pd.isna(uvc_flux):
        return "Not enough data"
    if uvc_flux < low_threshold:
        return "Low"
    elif uvc_flux < high_threshold:
        return "Medium"
    return "High"


def uvc_note(uvc_class):
    if uvc_class == "Low":
        return "Lower estimated top-of-atmosphere UVC exposure"
    elif uvc_class == "Medium":
        return "Moderate estimated top-of-atmosphere UVC exposure"
    elif uvc_class == "High":
        return "Higher estimated top-of-atmosphere UVC exposure"
    return "Not enough data"


def format_value(value, decimals=6, suffix=""):
    if value is None or pd.isna(value):
        return "Not enough data"
    return f"{value:.{decimals}f}{suffix}"


def print_intro():
    print("=" * 65)
    print("EXOPLANET UVC CALCULATOR")
    print("=" * 65)
    print()
    print("This version only shows the UVC-related output.")
    print("It is meant to complement your original habitability model.")
    print()
    print("How to use:")
    print("1. Enter a HOST STAR name exactly as it appears in the NASA dataset")
    print("2. The program will show the star's UV setup once")
    print("3. Then it will show estimated UVC results for each planet")
    print()
    print("Examples:")
    print("  Kepler-442")
    print("  TRAPPIST-1")
    print("  Kepler-62")
    print()


def print_star_data(star_name, first_row, template_name):
    st_spectype = first_row["st_spectype"]
    st_teff = first_row["st_teff"]
    st_age = first_row["st_age"]
    st_met = first_row["st_met"]

    print("\n" + "=" * 65)
    print(f"SYSTEM REPORT: {star_name}")
    print("=" * 65)

    print("\nSTAR DATA")
    print(f"  Name: {star_name}")
    print(f"  Spectral type: {st_spectype if pd.notna(st_spectype) else 'Not enough data'}")
    print(f"  Stellar temperature: {format_value(st_teff, 1, ' K')}")
    print(f"  Stellar age: {format_value(st_age, 3, ' Gyr')}")
    print(f"  Stellar metallicity: {format_value(st_met, 3, ' dex')}")
    print(f"  UV template used: {template_name}")


def print_planet_data(df, template):
    print("\nUVC RESULTS")

    st_lum = df.iloc[0]["st_lum"]

    for i, (_, row) in enumerate(df.iterrows(), start=1):
        planet_name = row["pl_name"]
        orbital_distance = row["pl_orbsmax"]

        uvc_flux = compute_uvc_flux(template, orbital_distance, st_lum)
        uvc_class = classify_uvc(uvc_flux)
        note = uvc_note(uvc_class)

        print(f"\nPLANET {i}")
        print(f"  Name: {planet_name}")
        print(f"  Estimated UVC flux: {format_value(uvc_flux, 6, '')}")
        print(f"  UVC class: {uvc_class}")
        print(f"  UVC note: {note}")


# ============================================================
# MAIN PROGRAM
# ============================================================
def main():
    print_intro()
    templates = make_uv_templates()

    while True:
        star_name = input("Enter host star name: ").strip()

        if not star_name:
            print("Please enter a valid host star name.\n")
            continue

        try:
            df = get_planets_for_star(star_name)

            if df.empty:
                print("\nNo planets found for that host star.")
                print("Check spelling, spaces, and punctuation, then try again.\n")
                continue

            first_row = df.iloc[0]
            template = choose_template(first_row["st_spectype"], first_row["st_teff"], templates)

            print_star_data(
                star_name=star_name,
                first_row=first_row,
                template_name=template["name"]
            )

            print_planet_data(
                df=df,
                template=template
            )

            print("\n" + "=" * 65)
            again = input("Would you like to check another host star? (yes/no): ").strip().lower()
            print()

            if again not in ["yes", "y"]:
                print("Calculator closed.")
                break

        except requests.exceptions.HTTPError:
            print("\nThere was a problem contacting the NASA Exoplanet Archive.")
            print("Please try again later.\n")

        except requests.exceptions.RequestException:
            print("\nThere was a network problem while loading the data.")
            print("Check your internet connection and try again.\n")

        except Exception:
            print("\nSomething unexpected went wrong.")
            print("Please check the star name and try again.\n")


if __name__ == "__main__":
    main()