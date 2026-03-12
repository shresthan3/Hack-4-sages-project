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

