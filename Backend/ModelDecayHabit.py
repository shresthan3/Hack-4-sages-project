import math
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

# Import from your existing files
from ModelHabitibilityScore import (
    get_or_create_model,
    get_planets_for_star,
    build_feature_table,
)

from ModelGen import compute_luminosity, compute_habitable_zone
from ModelUVC import make_uv_templates, choose_template, compute_uvc_flux


# ============================================================
# DECAY MODEL FUNCTIONS
# ============================================================
def safe_stress(value, max_bad, default=0.5):
    """
    Higher values are worse.
    Returns a stress value from 0 to 1.
    """
    if value is None or pd.isna(value):
        return default

    stress = value / max_bad
    return max(0.0, min(1.0, stress))


def goldilocks_stress(pl_orbsmax, hz_inner, hz_outer):
    """
    0 = ideal in habitable zone
    higher = farther from habitable zone
    """
    if pd.isna(pl_orbsmax) or pd.isna(hz_inner) or pd.isna(hz_outer):
        return 0.5

    if hz_inner <= pl_orbsmax <= hz_outer:
        return 0.0

    if pl_orbsmax < hz_inner:
        diff = (hz_inner - pl_orbsmax) / max(hz_inner, 1e-6)
    else:
        diff = (pl_orbsmax - hz_outer) / max(hz_outer, 1e-6)

    return max(0.0, min(1.0, 2.0 * diff))


def compute_decay_constant(row):
    """
    Build a decay constant k from existing model features.
    Bigger k = faster habitability decline.
    """
    st_rad = row["st_rad"]
    st_teff = row["st_teff"]
    st_lum = row["st_lum"]
    st_age = row["st_age"]
    st_spectype = row["st_spectype"]

    pl_orbsmax = row["pl_orbsmax"]
    pl_orbeccen = row["pl_orbeccen"]
    pl_insol = row["pl_insol"]
    pl_eqt = row["pl_eqt"]

    # Use ModelGen
    luminosity = compute_luminosity(st_rad, st_teff, st_lum)
    hz_inner, hz_outer = compute_habitable_zone(luminosity)

    # Use ModelUVC
    templates = make_uv_templates()
    template = choose_template(st_spectype, st_teff, templates)
    uvc_flux = compute_uvc_flux(template, pl_orbsmax, st_lum)

    # Stress components
    s_uvc = safe_stress(uvc_flux, max_bad=0.02, default=0.5)
    s_ecc = safe_stress(pl_orbeccen, max_bad=0.4, default=0.5)
    s_insol = min(1.0, abs(pl_insol - 1.0) / 2.0) if pd.notna(pl_insol) else 0.5
    s_temp = min(1.0, abs(pl_eqt - 255.0) / 150.0) if pd.notna(pl_eqt) else 0.5
    s_goldi = goldilocks_stress(pl_orbsmax, hz_inner, hz_outer)
    s_age = min(1.0, st_age / 10.0) if pd.notna(st_age) else 0.5

    # Weighted decay constant
    k = (
        0.020 +
        0.030 * s_uvc +
        0.020 * s_ecc +
        0.020 * s_insol +
        0.015 * s_temp +
        0.025 * s_goldi +
        0.010 * s_age
    )

    return k, uvc_flux, hz_inner, hz_outer


def habitability_over_time(H0, k, t):
    """
    Exponential decay model:
    H(t) = H0 * exp(-k * t)
    t is in Gyr.
    """
    return H0 * math.exp(-k * t)


def generate_habitability_curve(H0, k, max_time=10.0, points=300):
    times = np.linspace(0, max_time, points)
    scores = np.array([habitability_over_time(H0, k, t) for t in times])
    scores = np.clip(scores, 0, 100)
    return times, scores


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


# ============================================================
# GRAPHING
# ============================================================
def plot_habitability_curve(star_name, planet_name, times, scores, H0, k):
    plt.figure(figsize=(10, 6))
    plt.plot(times, scores, linewidth=2)
    plt.ylim(0, 100)
    plt.xlim(times.min(), times.max())
    plt.xlabel("Time (Gyr)")
    plt.ylabel("Habitability Score")
    plt.title(f"Habitability Decay Over Time\n{planet_name} around {star_name}")
    plt.grid(True, alpha=0.3)

    plt.scatter([0], [H0], s=50)
    plt.annotate(f"Start: {H0:.1f}", (0, H0), textcoords="offset points", xytext=(8, 8))

    mid_t = times[len(times) // 2]
    mid_score = scores[len(scores) // 2]
    plt.annotate(f"k = {k:.4f}", (mid_t, mid_score), textcoords="offset points", xytext=(10, -15))

    plt.tight_layout()
    plt.show()


# ============================================================
# INPUT HELPERS
# ============================================================
def get_valid_planet_number(result_df):
    """
    Ask user for a planet number until they enter a valid one.
    """
    print("\nPlanets found:")
    for i, (_, row) in enumerate(result_df.iterrows(), start=1):
        print(f"  {i}. {row['pl_name']} — current score {row['habitability_score']:.1f}%")

    print(f"\nEnter a number from 1 to {len(result_df)}.")

    while True:
        choice_text = input("Planet number: ").strip()

        try:
            choice = int(choice_text)
        except ValueError:
            print("Please enter a whole number like 1, 2, or 3.")
            continue

        if 1 <= choice <= len(result_df):
            return choice

        print(f"Please enter a number between 1 and {len(result_df)}.")


def get_valid_max_time():
    """
    Ask user for max graph time. Blank = 10.
    """
    while True:
        max_time_input = input("Enter max graph time in Gyr (press Enter for 10): ").strip()

        if max_time_input == "":
            return 10.0

        try:
            max_time = float(max_time_input)
            if max_time <= 0:
                print("Please enter a positive number.")
                continue
            return max_time
        except ValueError:
            print("Please enter a valid number.")


def query_specific_times(H0, k):
    """
    After plotting, let the user ask for habitability at specific times.
    """
    while True:
        t_input = input("Enter a specific time in Gyr to get habitability score (or type 'done'): ").strip().lower()

        if t_input == "done":
            break

        try:
            t_val = float(t_input)
            if t_val < 0:
                print("Please enter a non-negative time.")
                continue

            future_score = habitability_over_time(H0, k, t_val)
            future_score = max(0.0, min(100.0, future_score))

            print(f"Habitability at {t_val:.2f} Gyr: {future_score:.2f}%")
            print(f"Rating: {score_label(future_score)}\n")

        except ValueError:
            print("Please enter a valid number or 'done'.")


# ============================================================
# MAIN PROGRAM
# ============================================================
def main():
    print("=" * 70)
    print("EXOPLANET HABITABILITY DECAY GRAPH")
    print("=" * 70)
    print()
    print("This script uses:")
    print("- ModelHabitibilityScore.py for the base habitability score")
    print("- ModelGen.py for habitable zone / luminosity logic")
    print("- ModelUVC.py for UVC flux")
    print()
    print("Enter a HOST STAR name exactly as it appears in the NASA dataset.")
    print("Examples:")
    print("  Kepler-442")
    print("  TRAPPIST-1")
    print("  Kepler-62")
    print()

    try:
        print("Loading saved habitability model...")
        model, feature_cols = get_or_create_model()
    except Exception as exc:
        print("Could not load the habitability model.")
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

            # Predict current habitability scores
            star_features, _ = build_feature_table(star_df)
            X_star = star_features[feature_cols]
            predictions = model.predict(X_star)
            predictions = np.clip(predictions, 0, 100)

            result_df = star_df.copy()
            result_df["habitability_score"] = predictions

            # Simple number input for planet selection
            choice = get_valid_planet_number(result_df)
            selected_row = result_df.iloc[choice - 1]

            planet_name = selected_row["pl_name"]
            H0 = float(selected_row["habitability_score"])

            k, uvc_flux, hz_inner, hz_outer = compute_decay_constant(selected_row)

            max_time = get_valid_max_time()
            times, scores = generate_habitability_curve(H0, k, max_time=max_time)

            print("\n" + "=" * 70)
            print(f"DECAY REPORT: {planet_name}")
            print("=" * 70)
            print(f"Star: {star_name}")
            print(f"Current habitability score: {H0:.1f}%")
            print(f"Decay constant k: {k:.4f}")
            if uvc_flux is not None and not pd.isna(uvc_flux):
                print(f"Estimated UVC flux used in decay: {uvc_flux:.6f}")
            else:
                print("Estimated UVC flux used in decay: Not enough data")
            print()

            plot_habitability_curve(star_name, planet_name, times, scores, H0, k)

            query_specific_times(H0, k)

            again = input("Would you like to check another host star? (yes/no): ").strip().lower()
            if again not in ["yes", "y"]:
                print("Program closed.")
                break

        except Exception as exc:
            print("Something went wrong:")
            print(exc)


if __name__ == "__main__":
    main()