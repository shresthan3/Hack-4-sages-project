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

