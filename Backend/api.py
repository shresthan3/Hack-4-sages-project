from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import pandas as pd

from ModelHabitibilityScore import (
    get_or_create_model,
    get_planets_for_star,
    build_feature_table,
)
from ModelGen import compute_luminosity, compute_habitable_zone, compute_esi, rocky_note
from ModelUVC import make_uv_templates, choose_template, compute_uvc_flux, classify_uvc
from ModelMagnetosphere import get_magnetosphere_data_for_star, build_magnetosphere_report
from ModelDecayHabit import compute_decay_constant, generate_habitability_curve


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # in production, restrict this
    allow_methods=["*"],
    allow_headers=["*"],
)


model, feature_cols = get_or_create_model()
uv_templates = make_uv_templates()


def _safe_float(value, default=None):
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return default
    try:
        return float(value)
    except Exception:
        return default


@app.get("/star/{hostname}")
def get_star(hostname: str):
    """
    API used by the Next.js frontend.

    Returns a Star object whose shape matches frontend/data/starData.ts:
    - name, spectral_type, age, temperature, mass, luminosity, hz_inner, hz_outer
    - planets: array of Planet objects with habitability & UV fields
    """
    df = get_planets_for_star(hostname)
    if df.empty:
        raise HTTPException(status_code=404, detail="Star not found")

    first = df.iloc[0]

    # Star-level quantities
    luminosity = compute_luminosity(first["st_rad"], first["st_teff"], first["st_lum"])
    hz_inner, hz_outer = compute_habitable_zone(luminosity)

    # Habitability model predictions
    feature_df, feature_cols_local = build_feature_table(df)
    X = feature_df[feature_cols_local]
    scores = np.clip(model.predict(X), 0, 100)

    # UV template for this star
    template = choose_template(first["st_spectype"], first["st_teff"], uv_templates)
    st_lum = first["st_lum"]

    planets = []
    n_planets = len(df)

    for idx, (_, row) in enumerate(df.iterrows()):
        pl_name = row["pl_name"]
        orbit = row["pl_orbsmax"]

        # UVC flux and prebiotic window
        uvc_flux = compute_uvc_flux(template, orbit, st_lum)
        uvc_class = classify_uvc(uvc_flux)
        prebiotic_uv = uvc_class == "Medium"

        # Habitable zone classification
        if hz_inner is not None and hz_outer is not None and pd.notna(orbit):
            if hz_inner <= orbit <= hz_outer:
                hz_status = "Inside HZ"
            elif (
                orbit < hz_inner
                and (hz_inner - orbit) / max(hz_inner, 1e-6) < 0.2
            ) or (
                orbit > hz_outer
                and (orbit - hz_outer) / max(hz_outer, 1e-6) < 0.2
            ):
                hz_status = "Edge of HZ"
            else:
                hz_status = "Outside HZ"
        else:
            hz_status = "Outside HZ"

        # Rockiness mapping
        rock_note = rocky_note(row["pl_dens"], row["pl_rade"], row["pl_bmasse"])
        if "gaseous" in rock_note or "Neptune" in rock_note:
            rockiness = "Gas Giant (smooth)"
        else:
            rockiness = "Rocky (textured)"

        # Simple orbit characteristics from eccentricity
        ecc = _safe_float(row["pl_orbeccen"], 0.0)
        if ecc < 0.1:
            orbit_char = "Low eccentricity, nearly circular"
        elif ecc < 0.3:
            orbit_char = "Moderately eccentric orbit"
        else:
            orbit_char = "Highly eccentric orbit"

        # ESI from radius + equilibrium temperature
        esi = compute_esi(row["pl_rade"], row["pl_eqt"]) or 0.0

        planets.append(
            {
                "id": pl_name.lower().replace(" ", "-"),
                "planet_name": pl_name,
                "planet_radius": _safe_float(row["pl_rade"], 1.0),
                "planet_mass": _safe_float(row["pl_bmasse"]),
                "planet_orbit_distance": _safe_float(orbit, 0.0),
                "planet_orbit_characteristics": orbit_char,
                "planet_habitable_zone": hz_status,
                "planet_esi": float(esi),
                "planet_habitability_score": float(scores[idx]),
                "planet_prebiotic_uv": bool(prebiotic_uv),
                "planet_uv_flux": _safe_float(uvc_flux, 0.0),
                "planet_rockiness": rockiness,
                "angle": 360.0 * idx / max(1, n_planets),
            }
        )

    return {
        "name": hostname,
        "spectral_type": first["st_spectype"],
        "age": _safe_float(first["st_age"], 0.0),
        "temperature": _safe_float(first["st_teff"], 0.0),
        "mass": 1.0,  # placeholder; can be updated if you add a mass column
        "luminosity": _safe_float(luminosity, 1.0),
        "hz_inner": _safe_float(hz_inner, 0.0),
        "hz_outer": _safe_float(hz_outer, 0.0),
        "planets": planets,
    }


@app.get("/star/{hostname}/planet/{planet_name}/decay")
def get_planet_decay(
    hostname: str,
    planet_name: str,
    max_time: float = 10.0,
    points: int = 300,
):
    """
    Return habitability decay curve for a specific planet in a star system.

    Used by the frontend to plot how the ML-based habitability score changes
    over time using the decay model from ModelDecayHabit.py.
    """
    df = get_planets_for_star(hostname)
    if df.empty:
        raise HTTPException(status_code=404, detail="Star not found")

    # Match planet by its catalog name (same as pl_name)
    planet_rows = df[df["pl_name"] == planet_name]
    if planet_rows.empty:
        raise HTTPException(status_code=404, detail="Planet not found for this star")

    # Predict current habitability scores for all planets in this system
    feature_df, feature_cols_local = build_feature_table(df)
    X = feature_df[feature_cols_local]
    all_scores = np.clip(model.predict(X), 0, 100)

    # Index of the selected planet within the dataframe
    planet_index = planet_rows.index[0]
    try:
        position = list(df.index).index(planet_index)
    except ValueError:
        raise HTTPException(status_code=500, detail="Internal indexing error")

    H0 = float(all_scores[position])

    # Decay parameters and related diagnostics
    k, uvc_flux, hz_inner, hz_outer = compute_decay_constant(planet_rows.iloc[0])
    times, scores = generate_habitability_curve(H0, k, max_time=max_time, points=points)

    return {
        "planet_name": planet_name,
        "host_star": hostname,
        "initial_score": H0,
        "decay_constant": k,
        "times": times.tolist(),
        "scores": scores.tolist(),
        "uvc_flux": _safe_float(uvc_flux, None),
        "hz_inner": _safe_float(hz_inner, None),
        "hz_outer": _safe_float(hz_outer, None),
    }


@app.get("/star/{hostname}/planet/{planet_name}/magnetosphere")
def get_planet_magnetosphere(
    hostname: str,
    planet_name: str,
):
    """
    Return magnetosphere information for a specific planet.

    Uses ModelMagnetosphere to compute a star-level summary plus
    a per-planet magnetosphere row. The frontend uses this to display
    fields like spin period, wind pressure, magnetopause size, and a
    simple shielding interpretation.
    """
    df = get_magnetosphere_data_for_star(hostname)
    if df.empty:
        raise HTTPException(status_code=404, detail="Star not found")

    star_info, report_df = build_magnetosphere_report(df)

    planet_rows = report_df[report_df["Planet"] == planet_name]
    if planet_rows.empty:
        raise HTTPException(status_code=404, detail="Planet not found for this star")

    row = planet_rows.iloc[0]

    return {
        "star_info": star_info,
        "magnetosphere": {
            "planet_type": row["Planet type"],
            "orbit_au": _safe_float(row.get("Orbit (AU)")),
            "orbital_period": _safe_float(row.get("Orbital period (days)")),
            "rotation_hours": _safe_float(row.get("Rotation used (hours)")),
            "rotation_assumption": row.get("Rotation assumption"),
            "wind_pressure": _safe_float(row.get("Wind pressure (Pa)")),
            "dipole_moment": _safe_float(row.get("Dipole moment (A m^2)")),
            "surface_field_ut": _safe_float(row.get("Surface field (uT)")),
            "magnetopause_rp": _safe_float(row.get("Magnetopause (Rp)")),
            "shielding": row.get("Shielding"),
        },
    }

