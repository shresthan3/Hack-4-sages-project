 "use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { Planet, Star } from "../../../../../data/starData";
import { fetchPlanetDecay, fetchStar } from "../../../../../lib/api";

interface DecayPoint {
  t: number;
  h: number;
}

export default function PlanetDecayPage() {
  const params = useParams<{ starName: string; planetId: string }>();
  const router = useRouter();

  const [star, setStar] = useState<Star | null>(null);
  const [planet, setPlanet] = useState<Planet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [decayPoints, setDecayPoints] = useState<DecayPoint[]>([]);
  const [initialScore, setInitialScore] = useState<number | null>(null);
  const [decayConstant, setDecayConstant] = useState<number | null>(null);
  const [uvcFlux, setUvcFlux] = useState<number | null>(null);
  const [hzInner, setHzInner] = useState<number | null>(null);
  const [hzOuter, setHzOuter] = useState<number | null>(null);
  const [hoverPoint, setHoverPoint] = useState<DecayPoint | null>(null);

  useEffect(() => {
    const starNameRaw = params?.starName;
    const planetIdRaw = params?.planetId;
    if (!starNameRaw || !planetIdRaw) return;

    const starName = decodeURIComponent(starNameRaw as string);
    const planetId = decodeURIComponent(planetIdRaw as string);

    fetchStar(starName)
      .then((starData) => {
        setStar(starData);
        const foundPlanet =
          starData.planets.find((p) => p.id === planetId) ??
          starData.planets[0] ??
          null;
        if (!foundPlanet) {
          router.replace("/");
          return;
        }
        setPlanet(foundPlanet);

        return fetchPlanetDecay(starName, foundPlanet.planet_name);
      })
      .then((decay) => {
        if (!decay) return;
        const points: DecayPoint[] = decay.times.map((t, idx) => ({
          t,
          h: decay.scores[idx],
        }));
        setDecayPoints(points);
        setInitialScore(decay.initial_score);
        setDecayConstant(decay.decay_constant);
        setUvcFlux(decay.uvc_flux);
        setHzInner(decay.hz_inner);
        setHzOuter(decay.hz_outer);
      })
      .catch(() => {
        setError("Star not found in database.");
      });
  }, [params, router]);

  const graphBounds = useMemo(() => {
    if (!decayPoints.length) {
      return { tMin: 0, tMax: 1, hMin: 0, hMax: 100 };
    }
    const tMin = 0;
    const tMax = decayPoints[decayPoints.length - 1].t;
    const hMin = 0;
    const hMax = 100;
    return { tMin, tMax, hMin, hMax };
  }, [decayPoints]);

  const pathD = useMemo(() => {
    if (!decayPoints.length) return "";
    const { tMin, tMax, hMin, hMax } = graphBounds;
    const width = 100;
    const height = 100;

    const scaleX = (t: number) =>
      ((t - tMin) / Math.max(tMax - tMin, 1e-6)) * width;
    const scaleY = (h: number) =>
      height - ((h - hMin) / Math.max(hMax - hMin, 1e-6)) * height;

    return decayPoints
      .map((p, idx) => {
        const x = scaleX(p.t);
        const y = scaleY(p.h);
        return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }, [decayPoints, graphBounds]);

  const handleGraphHover = (
    e: React.MouseEvent<SVGRectElement, MouseEvent>
  ) => {
    if (!decayPoints.length) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const width = rect.width;
    const { tMin, tMax } = graphBounds;

    const hoveredT =
      tMin + (relativeX / Math.max(width, 1e-6)) * (tMax - tMin);

    let closest: DecayPoint | null = null;
    let bestDist = Infinity;
    for (const p of decayPoints) {
      const dist = Math.abs(p.t - hoveredT);
      if (dist < bestDist) {
        bestDist = dist;
        closest = p;
      }
    }
    setHoverPoint(closest);
  };

  const clearHover = () => setHoverPoint(null);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B1026]">
        <div className="max-w-md rounded-lg border border-[#6E7BAA]/20 bg-[#1A2142] p-6 text-center">
          <div className="mb-4 text-lg font-semibold text-white">{error}</div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-[#4BE37A] px-4 py-2 font-semibold text-[#0B1026] transition-colors hover:bg-[#3BC366]"
          >
            Return to Explorer
          </Link>
        </div>
      </div>
    );
  }

  if (!star || !planet) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B1026]">
        <div className="text-xl text-white">Loading habitability decay...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1026] text-white">
      <header className="border-b border-[#6E7BAA]/20 bg-[#0B1026] px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link
            href={`/system/${encodeURIComponent(star.name)}`}
            className="flex items-center gap-2 text-gray-300 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to System</span>
          </Link>
          <div className="text-sm text-gray-400">
            Habitability over time for{" "}
                <div className="font-semibold text-[#4BE37A]">
                    t = {hoverPoint.t.toFixed(2)} Gyr
                  </div>
                  <div>
                    H(t) ≈{" "}
                    <span className="font-semibold">
                      {hoverPoint.h.toFixed(2)}%
                    </span>
                  </div>
          <div className="rounded-lg border border-[#6E7BAA]/20 bg-[#1A2142] p-5">
            <h1 className="mb-1 text-2xl font-semibold text-[#4BE37A]">
              Habitability Decay Curve
            </h1>
            <p className="mb-4 text-sm text-gray-300">
              Estimated change in the ML-based habitability score over billions
              of years for this planet, based on stellar radiation, orbit, and
              other environmental stresses.
            </p>

            <div className="relative mt-4 h-64 w-full">
              <svg viewBox="0 0 120 100" className="h-full w-full">
                <line
                  x1="10"
                  y1="90"
                  x2="110"
                  y2="90"
                  stroke="#6E7BAA"
                  strokeWidth={0.5}
                />
                <line
                  x1="10"
                  y1="10"
                  x2="10"
                  y2="90"
                  stroke="#6E7BAA"
                  strokeWidth={0.5}
                />

                <text
                  x="60"
                  y="98"
                  textAnchor="middle"
                  className="fill-gray-400 text-[3px]"
                >
                  Time (Gyr)
                </text>
                <text
                  x="0"
                  y="8"
                  textAnchor="start"
                  className="fill-gray-400 text-[3px]"
                >
                  Habitability score (%)
                </text>

                <path
                  d={pathD
                    ? `M 10 0 ${pathD
                        .split(" ")
                        .map((v, idx) =>
                          idx % 2 === 1 ? String(Number(v)) : v
                        )
                        .join(" ")}`
                    : ""}
                  transform="translate(10,0)"
                  fill="none"
                  stroke="#4BE37A"
                  strokeWidth={1.2}
                />

                {hoverPoint && (
                  <>
                    <circle
                      cx={
                        10 +
                        ((hoverPoint.t - graphBounds.tMin) /
                          Math.max(
                            graphBounds.tMax - graphBounds.tMin,
                            1e-6
                          )) *
                          100
                      }
                      cy={
                        100 -
                        ((hoverPoint.h - graphBounds.hMin) /
                          Math.max(
                            graphBounds.hMax - graphBounds.hMin,
                            1e-6
                          )) *
                          100
                      }
                      r={1.5}
                      fill="#FFD36E"
                    />
                  </>
                )}

                <rect
                  x={10}
                  y={10}
                  width={100}
                  height={80}
                  fill="transparent"
                  onMouseMove={handleGraphHover}
                  onMouseLeave={clearHover}
                />
              </svg>

              {hoverPoint && (
                <div className="pointer-events-none absolute right-4 top-4 rounded-lg border border-[#6E7BAA]/30 bg-[#0B1026]/90 px-3 py-2 text-xs text-white shadow-lg">
                  <div className="font-semibold text-[#4BE37A]">
                    t = {hoverPoint.t.toFixed(2)} Gyr
                  </div>
                  <div>
                    H(t) ≈{" "}
                    <span className="font-semibold">
                      {hoverPoint.h.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 grid gap-4 text-sm text-gray-300 md:grid-cols-3">
              <div>
                <div className="text-xs uppercase text-gray-400">
                  Current habitability
                </div>
                <div className="text-lg font-semibold text-white">
                  {initialScore !== null
                    ? `${initialScore.toFixed(2)}%`
                    : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase text-gray-400">
                  Decay constant k
                </div>
                <div className="text-lg font-semibold text-white">
                  {decayConstant !== null ? decayConstant.toFixed(4) : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase text-gray-400">
                  UVC surface flux
                </div>
                <div className="text-lg font-semibold text-white">
                  {uvcFlux !== null ? `${uvcFlux.toFixed(4)} (relative)` : "—"}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-[#6E7BAA]/20 bg-[#1A2142] p-4">
              <h2 className="mb-3 text-sm font-semibold uppercase text-gray-400">
                Planet Snapshot
              </h2>
              <div className="mb-4 flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#4BE37A] via-[#1A2142] to-[#6E7BAA] shadow-[0_0_25px_rgba(75,227,122,0.5)]" />
                <div className="space-y-1 text-sm">
                  <div className="text-base font-semibold text-white">
                    {planet.planet_name}
                  </div>
                  <div className="text-gray-300">
                    Around {star.name} ({star.spectral_type})
                  </div>
                  <div className="text-xs text-gray-400">
                    Artistic placeholder image – not an actual observation
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Radius:</span>
                  <span className="text-white">
                    {planet.planet_radius.toFixed(2)} R⊕
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Mass:</span>
                  <span className="text-white">
                    {planet.planet_mass
                      ? `${planet.planet_mass.toFixed(2)} M⊕`
                      : "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Distance from star:</span>
                  <span className="text-white">
                    {planet.planet_orbit_distance.toFixed(4)} AU
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Earth Similarity Index:</span>
                  <span className="text-white">
                    {planet.planet_esi.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Current habitability:</span>
                  <span className="text-white">
                    {planet.planet_habitability_score.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[#6E7BAA]/20 bg-[#1A2142] p-4 text-sm">
              <h2 className="mb-3 text-sm font-semibold uppercase text-gray-400">
                Quick Interpretation
              </h2>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <span className="font-semibold text-white">
                    Composition:
                  </span>{" "}
                  {planet.planet_rockiness.includes("Rocky")
                    ? "Likely has a solid surface that could host liquid water if conditions are right."
                    : "Gas-rich world where a solid surface is unlikely; habitability would depend on exotic upper-atmosphere layers."}
                </li>
                <li>
                  <span className="font-semibold text-white">
                    Habitable zone:
                  </span>{" "}
                  {hzInner !== null && hzOuter !== null
                    ? `Orbits at ${planet.planet_orbit_distance.toFixed(
                        3
                      )} AU relative to an estimated habitable zone of ${hzInner.toFixed(
                        3
                      )}–${hzOuter.toFixed(3)} AU (${planet.planet_habitable_zone}).`
                    : `Orbits in a region classified as ${planet.planet_habitable_zone}.`}
                </li>
                <li>
                  <span className="font-semibold text-white">
                    Prebiotic UV:
                  </span>{" "}
                  {planet.planet_prebiotic_uv
                    ? "Receives a moderate amount of UV that could help drive prebiotic chemistry without completely sterilizing the surface."
                    : "UV levels are outside the preferred prebiotic range, which may either suppress chemistry or be too harsh for fragile molecules."}
                </li>
                <li>
                  <span className="font-semibold text-white">
                    Orbital characteristics:
                  </span>{" "}
                  {planet.planet_orbit_characteristics}.
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-[#6E7BAA]/20 bg-[#1A2142] p-5 text-sm text-gray-300">
          <h2 className="mb-3 text-sm font-semibold uppercase text-gray-400">
            Analysis Notes & Disclaimer
          </h2>
          <p className="mb-2">
            This page combines the machine-learning habitability score with a
            simple exponential decay model. The model considers{" "}
            <span className="font-semibold text-white">
              stellar age, UV radiation, orbit shape, insolation, temperature,
              and distance from the habitable zone
            </span>{" "}
            to estimate how the score might change over time.
          </p>
          <p className="mb-2">
            The interpretation touches on{" "}
            <span className="font-semibold text-white">
              composition, habitable-zone placement, prebiotic UV window, and
              orbital characteristics
            </span>
            . These are all key ingredients for assessing whether a world might
            support life as we know it.
          </p>
          <p className="mt-3 text-xs text-gray-400">
            Important disclaimer:{" "}
            <span className="font-semibold text-white">
              habitability scores and decay curves are only estimates
            </span>
            . They rely on incomplete exoplanet data, simplified physics, and
            assumptions that may not hold for every system. Real-world
            habitability is far more complex and would require detailed
            observations of atmospheres, surfaces, and long-term stellar
            behavior.
          </p>
        </section>
      </main>
    </div>
  );
}

