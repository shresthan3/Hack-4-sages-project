import type { Star } from "../data/starData";

const BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

export async function fetchStar(starName: string): Promise<Star> {
  const res = await fetch(
    `${BASE_URL}/star/${encodeURIComponent(starName)}`,
    {
      // ensure fresh data in dev
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error("Star not found");
  }

  return res.json();
}

export interface PlanetDecayResponse {
  planet_name: string;
  host_star: string;
  initial_score: number;
  decay_constant: number;
  times: number[];
  scores: number[];
  uvc_flux: number | null;
  hz_inner: number | null;
  hz_outer: number | null;
}

export interface PlanetMagnetosphereResponse {
  star_info: {
    hostname: string;
    spectral_type: string | null;
    stellar_mass: number | null;
    stellar_age: number | null;
    luminosity: number | null;
    hz_inner: number | null;
    hz_outer: number | null;
  };
  magnetosphere: {
    planet_type: string;
    orbit_au?: number | null;
    orbital_period?: number | null;
    rotation_hours?: number | null;
    rotation_assumption?: string;
    wind_pressure?: number | null;
    dipole_moment?: number | null;
    surface_field_ut?: number | null;
    magnetopause_rp?: number | null;
    shielding?: string;
  };
}

export async function fetchPlanetDecay(
  starName: string,
  planetName: string,
  options?: { maxTime?: number; points?: number }
): Promise<PlanetDecayResponse> {
  const url = new URL(
    `${BASE_URL}/star/${encodeURIComponent(starName)}/planet/${encodeURIComponent(
      planetName
    )}/decay`
  );

  if (options?.maxTime !== undefined) {
    url.searchParams.set("max_time", String(options.maxTime));
  }
  if (options?.points !== undefined) {
    url.searchParams.set("points", String(options.points));
  }

  const res = await fetch(url.toString(), {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Decay data not available");
  }

  return res.json();
}

export async function fetchPlanetMagnetosphere(
  starName: string,
  planetName: string
): Promise<PlanetMagnetosphereResponse> {
  const res = await fetch(
    `${BASE_URL}/star/${encodeURIComponent(starName)}/planet/${encodeURIComponent(
      planetName
    )}/magnetosphere`,
    { cache: "no-store" }
  );
  if (!res.ok) {
    throw new Error("Magnetosphere data not available");
  }
  return res.json();
}

