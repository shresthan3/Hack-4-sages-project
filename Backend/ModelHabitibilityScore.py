import os
import math
import joblib
import numpy as np
import pandas as pd
import requests
from io import StringIO
from urllib.parse import quote_plus

from sklearn.ensemble import GradientBoostingRegressor
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline

# ============================================================
# IMPORTS FROM YOUR OTHER FILES
# ============================================================
from ModelUVC import make_uv_templates, choose_template, compute_uvc_flux
from ModelGen import compute_luminosity, compute_habitable_zone

# ============================================================
# SAVE PATHS
# ============================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_FILE = os.path.join(BASE_DIR, "habitability_model.joblib")
FEATURES_FILE = os.path.join(BASE_DIR, "habitability_feature_columns.joblib")

# ============================================================
# NASA TRAINING DATA
# ============================================================
def load_training_data(limit=3000):
    """
    Load a training sample from NASA Exoplanet Archive PSCompPars.
    """
    query = f"""
    select top {limit}
        pl_name, hostname, st_rad, st_teff, st_spectype, st_lum, st_age, st_met,
        pl_orbsmax, pl_dens, pl_orbeccen, pl_insol, pl_eqt, pl_rade, pl_bmasse
    from pscomppars
    """
    url = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=" + quote_plus(query) + "&format=csv"
    response = requests.get(url, timeout=90)
    response.raise_for_status()
    return pd.read_csv(StringIO(response.text))


def get_planets_for_star(hostname):
    """
    Load all planets for one host star.
    """
    query = f"""
    select
        pl_name, hostname, st_rad, st_teff, st_spectype, st_lum, st_age, st_met,
        pl_orbsmax, pl_dens, pl_orbeccen, pl_insol, pl_eqt, pl_rade, pl_bmasse
    from pscomppars
    where hostname = '{hostname}'
    """
    url = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=" + quote_plus(query) + "&format=csv"
    response = requests.get(url, timeout=90)
    response.raise_for_status()
    return pd.read_csv(StringIO(response.text))


# ============================================================
# FEATURE HELPERS
# ============================================================
def spectral_family_to_number(st_spectype):
    """
    Convert spectral family to a number:
    F=4, G=3, K=2, M=1, unknown=0
    """
    if pd.isna(st_spectype):
        return 0

    text = str(st_spectype).strip().upper()
    for char in text:
        if char == "F":
            return 4
        if char == "G":
            return 3
        if char == "K":
            return 2
        if char == "M":
            return 1

    return 0


def safe_closeness_score(value, ideal, tolerance):
    """
    Returns a score from 0 to 1 based on closeness to an ideal value.
    """
    if pd.isna(value):
        return 0.5

    distance = abs(value - ideal) / tolerance
    return max(0.0, 1.0 - distance)


def safe_inverse_penalty(value, max_bad):
    """
    Lower values are better. Returns score from 0 to 1.
    """
    if pd.isna(value):
        return 0.5

    score = 1.0 - (value / max_bad)
    return max(0.0, min(1.0, score))


def goldilocks_score(pl_orbsmax, hz_inner, hz_outer):
    """
    Soft score for being inside or near the habitable zone.
    """
    if pd.isna(pl_orbsmax) or pd.isna(hz_inner) or pd.isna(hz_outer):
        return 0.5

    if hz_inner <= pl_orbsmax <= hz_outer:
        return 1.0

    if pl_orbsmax < hz_inner:
        diff = (hz_inner - pl_orbsmax) / max(hz_inner, 1e-6)
    else:
        diff = (pl_orbsmax - hz_outer) / max(hz_outer, 1e-6)

    return max(0.0, 1.0 - 2.0 * diff)


# ============================================================
# BUILD FEATURES USING YOUR OTHER FILES
# ============================================================
def build_feature_table(df):
    """
    Build feature table using functions imported from ModelUVC.py
    and ModelGen.py.
    """
    out = df.copy()

    templates = make_uv_templates()

    luminosities = []
    hz_inners = []
    hz_outers = []
    uvc_fluxes = []
    uvc_classes_num = []
    spectral_codes = []

    for _, row in out.iterrows():
        st_rad = row["st_rad"]
        st_teff = row["st_teff"]
        st_lum = row["st_lum"]
        st_spectype = row["st_spectype"]
        pl_orbsmax = row["pl_orbsmax"]

        # From ModelGen.py
        luminosity = compute_luminosity(st_rad, st_teff, st_lum)
        hz_inner, hz_outer = compute_habitable_zone(luminosity)

        # From ModelUVC.py
        template = choose_template(st_spectype, st_teff, templates)
        uvc_flux = compute_uvc_flux(template, pl_orbsmax, st_lum)

        if uvc_flux is None or pd.isna(uvc_flux):
            uvc_class_num = 0
        elif uvc_flux < 0.001:
            uvc_class_num = 1
        elif uvc_flux < 0.01:
            uvc_class_num = 2
        else:
            uvc_class_num = 3

        luminosities.append(luminosity)
        hz_inners.append(hz_inner)
        hz_outers.append(hz_outer)
        uvc_fluxes.append(uvc_flux)
        uvc_classes_num.append(uvc_class_num)
        spectral_codes.append(spectral_family_to_number(st_spectype))

    out["luminosity_linear"] = luminosities
    out["hz_inner"] = hz_inners
    out["hz_outer"] = hz_outers
    out["uvc_flux"] = uvc_fluxes
    out["uvc_class_num"] = uvc_classes_num
    out["spectral_code"] = spectral_codes

    feature_cols = [
        "pl_orbsmax",
        "pl_insol",
        "pl_eqt",
        "pl_rade",
        "pl_bmasse",
        "pl_dens",
        "pl_orbeccen",
        "st_teff",
        "luminosity_linear",
        "st_age",
        "st_met",
        "spectral_code",
        "hz_inner",
        "hz_outer",
        "uvc_flux",
        "uvc_class_num",
    ]

    return out, feature_cols


# ============================================================
# PROXY HABITABILITY TARGET
# ============================================================
def make_proxy_habitability_score(df):
    """
    Build a 0-100 training target from the imported model outputs
    and NASA dataset values.
    """
    scores = []

    for _, row in df.iterrows():
        s_goldi = goldilocks_score(row["pl_orbsmax"], row["hz_inner"], row["hz_outer"])
        s_insol = safe_closeness_score(row["pl_insol"], ideal=1.0, tolerance=1.0)
        s_temp = safe_closeness_score(row["pl_eqt"], ideal=255.0, tolerance=120.0)
        s_radius = safe_closeness_score(row["pl_rade"], ideal=1.0, tolerance=1.2)
        s_density = safe_closeness_score(row["pl_dens"], ideal=5.5, tolerance=3.0)
        s_ecc = safe_inverse_penalty(row["pl_orbeccen"], max_bad=0.4)

        # Lower UVC treated as better
        if pd.isna(row["uvc_flux"]):
            s_uvc = 0.5
        else:
            s_uvc = safe_inverse_penalty(row["uvc_flux"], max_bad=0.02)

        raw_score = (
            0.28 * s_goldi +
            0.18 * s_insol +
            0.18 * s_temp +
            0.12 * s_radius +
            0.10 * s_density +
            0.04 * s_ecc +
            0.10 * s_uvc
        )

        scores.append(round(raw_score * 100.0, 2))

    return pd.Series(scores, index=df.index)


# ============================================================
# TRAIN / SAVE / LOAD MODEL
# ============================================================
def train_habitability_model(training_df):
    feature_df, feature_cols = build_feature_table(training_df)
    feature_df["habitability_target"] = make_proxy_habitability_score(feature_df)

    X = feature_df[feature_cols]
    y = feature_df["habitability_target"]

    model = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="median")),
        ("gbr", GradientBoostingRegressor(
            n_estimators=250,
            learning_rate=0.05,
            max_depth=3,
            random_state=42
        ))
    ])

    model.fit(X, y)
    return model, feature_cols


def save_model(model, feature_cols):
    joblib.dump(model, MODEL_FILE)
    joblib.dump(feature_cols, FEATURES_FILE)


def load_saved_model():
    model = joblib.load(MODEL_FILE)
    feature_cols = joblib.load(FEATURES_FILE)
    return model, feature_cols


def get_or_create_model():
    """
    Load saved model if it exists.
    Otherwise train once, save, and return it.
    """
    if os.path.exists(MODEL_FILE) and os.path.exists(FEATURES_FILE):
        print("Loading saved habitability model...")
        return load_saved_model()

    print("No saved model found.")
    print("Loading NASA data for first-time training...")
    training_df = load_training_data(limit=3000)

    print("Training Gradient Boosting habitability model...")
    model, feature_cols = train_habitability_model(training_df)

    print("Saving trained model for future runs...")
    save_model(model, feature_cols)

    return model, feature_cols


# ============================================================
# OUTPUT HELPERS
# ============================================================
def score_label(score):
    if score >= 80:
        return "Very promising"
    if score >= 60:
        return "Promising"
    if score >= 40:
        return "Moderate"
    if score >= 20:
        return "Low"
    return "Very low"


def format_basic(value, decimals=1, suffix=""):
    if value is None or pd.isna(value):
        return "Not enough data"
    return f"{value:.{decimals}f}{suffix}"


def print_intro():
    print("=" * 68)
    print("EXOPLANET HABITABILITY SCORE CALCULATOR")
    print("=" * 68)
    print()
    print("This version:")
    print("- loads a saved trained model if it already exists")
    print("- only trains once on first run")
    print("- uses UVC data from ModelUVC.py")
    print("- uses habitable-zone logic from ModelGen.py")
    print()
    print("Enter a HOST STAR name exactly as it appears in the NASA dataset.")
    print("Examples:")
    print("  Kepler-442")
    print("  TRAPPIST-1")
    print("  Kepler-62")
    print("  Kepler-69")
    print()


def print_report(star_name, star_df, predicted_df):
    first = star_df.iloc[0]

    print("\n" + "=" * 68)
    print(f"SYSTEM REPORT: {star_name}")
    print("=" * 68)

    print("\nSTAR")
    print(f"  Name: {star_name}")
    print(f"  Spectral type: {first['st_spectype'] if pd.notna(first['st_spectype']) else 'Not enough data'}")
    print(f"  Stellar temperature: {format_basic(first['st_teff'], 1, ' K')}")

    print("\nPLANETS")
    for i, (_, row) in enumerate(predicted_df.iterrows(), start=1):
        score = float(row["habitability_score"])
        print(f"\n  {i}. {row['pl_name']}")
        print(f"     Habitability score: {score:.1f}%")
        print(f"     Rating: {score_label(score)}")


# ============================================================
# MAIN
# ============================================================
def main():
    print_intro()

    try:
        model, feature_cols = get_or_create_model()

    except requests.exceptions.RequestException:
        print("Could not load data from the NASA Exoplanet Archive.")
        return
    except Exception as exc:
        print("Problem while preparing the model:")
        print(exc)
        return

    while True:
        star_name = input("\nEnter host star name: ").strip()

        if not star_name:
            print("Please enter a valid host star name.")
            continue

        try:
            star_df = get_planets_for_star(star_name)

            if star_df.empty:
                print("No planets found for that host star. Check spelling and try again.")
                continue

            star_features, _ = build_feature_table(star_df)
            X_star = star_features[feature_cols]

            predictions = model.predict(X_star)
            predictions = np.clip(predictions, 0, 100)

            result_df = star_df[["pl_name"]].copy()
            result_df["habitability_score"] = predictions

            print_report(star_name, star_df, result_df)

            again = input("\nCheck another host star? (yes/no): ").strip().lower()
            if again not in ["yes", "y"]:
                print("Calculator closed.")
                break

        except requests.exceptions.RequestException:
            print("Network error while contacting the NASA Exoplanet Archive.")
        except Exception as exc:
            print("Something went wrong:")
            print(exc)


if __name__ == "__main__":
    main()