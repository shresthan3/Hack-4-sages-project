"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { Planet, Star } from "../../../../../data/starData";
import {
  fetchPlanetDecay,
  fetchPlanetMagnetosphere,
  fetchStar,
} from "../../../../../lib/api";

interface DecayPoint {
  t: number;
  h: number;
}

export default function MagnetospherePage() {
  const params = useParams<{ starName: string; planetId: string }>();
  const router = useRouter();

  const [star, setStar] = useState<Star | null>(null);
  const [planet, setPlanet] = useState<Planet | null>(null);
  const [error, setError] = useState<string | null>(null);

  // decay state (copied from decay page)
  const [decayPoints, setDecayPoints] = useState<DecayPoint[]>([]);
  const [initialScore, setInitialScore] = useState<number | null>(null);
  const [decayConstant, setDecayConstant] = useState<number | null>(null);
  const [uvcFlux, setUvcFlux] = useState<number | null>(null);
  const [hzInner, setHzInner] = useState<number | null>(null);
  const [hzOuter, setHzOuter] = useState<number | null>(null);
  const [hoverPoint, setHoverPoint] = useState<DecayPoint | null>(null);
  const [sliderT, setSliderT] = useState<number>(0);
  const [playing, setPlaying] = useState<boolean>(false);

  // magnetosphere data
  const [magData, setMagData] = useState<any | null>(null);
  const [linesVisible, setLinesVisible] = useState<boolean>(false);

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

        // fetch both decay and magnetosphere in parallel
        return Promise.all([
          fetchPlanetDecay(starName, foundPlanet.planet_name),
          fetchPlanetMagnetosphere(starName, foundPlanet.planet_name),
        ]);
      })
      .then((results) => {
        if (!results) return;
        const [decay, mag] = results as any;

        if (decay) {
          const points: DecayPoint[] = decay.times.map((t: number, idx: number) => ({
            t,
            h: decay.scores[idx],
          }));
          setDecayPoints(points);
          setInitialScore(decay.initial_score);
          setDecayConstant(decay.decay_constant);
          setUvcFlux(decay.uvc_flux);
          setHzInner(decay.hz_inner);
          setHzOuter(decay.hz_outer);
          // reset slider time
          setSliderT(0);
        }

        if (mag) {
          setMagData(mag);
        }
      })
      .catch(() => {
        setError("Star not found in database.");
      });
  }, [params, router]);

  // show lines after data arrives
  useEffect(() => {
    if (magData) {
      setLinesVisible(false);
      const id = setTimeout(() => setLinesVisible(true), 100);
      return () => clearTimeout(id);
    }
  }, [magData]);

  const graphBounds = useMemo(() => {
    if (!decayPoints.length) {
      // choose default time span if no points yet
      return { tMin: 0, tMax: 10, hMin: 0, hMax: 100 };
    }
    const tMin = 0;
    const tMax = decayPoints[decayPoints.length - 1].t;
    const hMin = 0;
    const hMax = 100;
    return { tMin, tMax, hMin, hMax };
  }, [decayPoints]);

  const pathD = useMemo(() => {
    // if there is a curve, use it; otherwise draw a flat line at current score
    if (decayPoints.length) {
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
    }

    if (initialScore !== null) {
      // flat line across entire plot
      const y = 100 - (initialScore / 100) * 100;
      return `M 0 ${y} L 100 ${y}`;
    }

    return "";
  }, [decayPoints, graphBounds, initialScore]);

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

  // slider / animation controls
  useEffect(() => {
    if (!playing) return;
    if (!decayPoints.length) return;
    const { tMax } = graphBounds;
    const interval = setInterval(() => {
      setSliderT((prev) => {
        const next = prev + (tMax || 0) / 200;
        if (next >= tMax) {
          setPlaying(false);
          clearInterval(interval);
          return tMax;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [playing, decayPoints, graphBounds]);

  useEffect(() => {
    // update hoverPoint when sliderT changes
    if (!decayPoints.length) return;
    let closest: DecayPoint | null = null;
    let bestDist = Infinity;
    for (const p of decayPoints) {
      const dist = Math.abs(p.t - sliderT);
      if (dist < bestDist) {
        bestDist = dist;
        closest = p;
      }
    }
    setHoverPoint(closest);
  }, [sliderT, decayPoints]);

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
        <div className="text-xl text-white">Loading magnetosphere data...</div>
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
            {hoverPoint && (
              <>
                <div className="font-semibold text-[#4BE37A]">
                  t = {hoverPoint.t.toFixed(2)} Gyr
                </div>
                <div>
                  H(t) ≈ <span className="font-semibold">{hoverPoint.h.toFixed(2)}%</span>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 p-6">
        {/* magnetosphere visualization and summary */}
        <section className="rounded-lg border border-[#6E7BAA]/20 bg-[#1A2142] p-5 text-sm">
          <h1 className="mb-3 text-2xl font-semibold text-[#4BE37A]">
            Magnetosphere Analysis
          </h1>
          <div className="mb-4">
            {/* dynamic magnetosphere graphic */}
            <div className="h-72 w-full rounded-lg bg-gradient-to-br from-[#1A2142] to-[#252F52] relative overflow-hidden">
              <div className="absolute top-2 left-2 text-xs text-gray-400">
                &larr; Star Direction
              </div>
              {/* legend note for prebiotic ring */}
              <svg viewBox="0 0 200 200" className="h-full w-full">
                {/* compute driving radii based on magnetopause (Rp) */}
                {magData && (() => {
                  const mpRp = magData.magnetosphere.magnetopause_rp || 0;
                  // make the planet big enough to dominate the frame
                  const planetR = 50; // base planet radius in pixels (larger than before)
                  const scale = 3.0; // px per Rp (reduce so arcs remain outside)
                  let mpR = planetR + mpRp * scale;
                  mpR = Math.min(mpR, 90); // clamp to viewbox
                  const center = 100;

                  // left half concentric arcs
                  const arcRadii = [planetR, planetR + mpR * 0.33, planetR + mpR * 0.66, mpR];

                  // right‑side bow shock curve
                  const bowPath = `M ${center} ${center - mpR}
                                   Q ${center + mpR * 1.2} ${center - mpR * 0.4}
                                     ${center + mpR} ${center}
                                   Q ${center + mpR * 1.2} ${center + mpR * 0.4}
                                     ${center} ${center + mpR}`;

                  return (
                    <>
                      {/* left-side mirrored bow curves at multiple radii */}
                      {arcRadii.map((r, idx) => {
                        const leftPath = `M ${center} ${center - r}
                                          Q ${center - r * 1.2} ${center - r * 0.4}
                                            ${center - r} ${center}
                                          Q ${center - r * 1.2} ${center + r * 0.4}
                                            ${center} ${center + r}`;
                        return (
                          <path
                            key={idx}
                            d={leftPath}
                            stroke="#4BE37A"
                            strokeWidth={idx === arcRadii.length - 1 ? 2 : 1}
                            fill="none"
                            opacity={0.7}
                          />
                        );
                      })}
                      {/* radial spokes within arcs */}
                      {[0, Math.PI / 4, (3 * Math.PI) / 4].map((ang, i) => (
                        <line
                          key={i}
                          x1={center}
                          y1={center}
                          x2={center + mpR * Math.cos(ang)}
                          y2={center - mpR * Math.sin(ang)}
                          stroke="#4BE37A"
                          strokeWidth={0.8}
                          opacity={0.5}
                        />
                      ))}
                      {/* bow shock on right */}
                      <path
                        d={bowPath}
                        stroke="#4BE37A"
                        strokeWidth={1.5}
                        fill="none"
                        opacity={0.9}
                      />

                      {/* planet circle drawn last to cover lines */}
                      <circle
                        cx={center}
                        cy={center}
                        r={planetR}
                        fill="#4BE37A"
                      />
                    </>
                  );
                })()}
                {/* fallback if no data available */}
                {!magData && (
                  <>
                    <circle cx="100" cy="100" r="40" fill="#4BE37A" opacity="0.2" />
                    <circle
                      cx="100"
                      cy="100"
                      r="60"
                      stroke="#4BE37A"
                      strokeWidth="2"
                      fill="none"
                    />
                    <path d="M100 100 L160 100" stroke="#4BE37A" strokeWidth="2" />
                    <path d="M100 100 L100 40" stroke="#4BE37A" strokeWidth="2" />
                  </>
                )}
              </svg>
            </div>
          </div>
          {magData && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <div className="text-xs uppercase text-gray-400">
                  Estimated spin period
                </div>
                <div className="text-lg font-semibold text-white">
                  {magData.magnetosphere.rotation_hours
                    ? `${magData.magnetosphere.rotation_hours.toFixed(1)} h`
                    : "—"}
                </div>
              </div>

              <div>
                <div className="text-xs uppercase text-gray-400">
                  Stellar wind pressure
                </div>
                <div className="text-lg font-semibold text-white">
                  {magData.magnetosphere.wind_pressure !== null
                    ? magData.magnetosphere.wind_pressure.toExponential(2) + " Pa"
                    : "—"}
                </div>
              </div>

              <div>
                <div className="text-xs uppercase text-gray-400">
                  Assumption of rotation
                </div>
                <div className="text-lg font-semibold text-white">
                  {magData.magnetosphere.rotation_assumption || "—"}
                </div>
              </div>

              <div>
                <div className="text-xs uppercase text-gray-400">
                  Magnetopause (Rp)
                </div>
                <div className="text-lg font-semibold text-white">
                  {magData.magnetosphere.magnetopause_rp !== null
                    ? magData.magnetosphere.magnetopause_rp.toFixed(2)
                    : "—"}
                </div>
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <div className="text-xs uppercase text-gray-400">
                  Interpretation of shielding
                </div>
                <div className="text-lg font-semibold text-white">
                  {magData.magnetosphere.shielding || "—"}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* planet properties (reuse simpler block) */}
        {planet && (
          <section className="rounded-lg border border-[#6E7BAA]/20 bg-[#1A2142] p-5 text-sm">
            <h2 className="mb-3 text-xl font-semibold text-[#4BE37A]">
              Planet Properties
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <span className="text-gray-400">Radius</span>
                <div className="text-white">
                  {planet.planet_radius.toFixed(2)} R⊕
                </div>
              </div>
              <div>
                <span className="text-gray-400">Mass</span>
                <div className="text-white">
                  {planet.planet_mass
                    ? `${planet.planet_mass.toFixed(2)} M⊕`
                    : "Unknown"}
                </div>
              </div>
              <div>
                <span className="text-gray-400">Orbital distance</span>
                <div className="text-white">
                  {planet.planet_orbit_distance.toFixed(4)} AU
                </div>
              </div>
              <div>
                <span className="text-gray-400">ESI score</span>
                <div className="text-white">
                  {planet.planet_esi.toFixed(2)}
                </div>
              </div>
              <div>
                <span className="text-gray-400">Composition</span>
                <div className="text-white">
                  {planet.planet_rockiness.split(" ")[0]}
                </div>
              </div>
              <div>
                <span className="text-gray-400">HZ Status</span>
                <div className="text-white">
                  {planet.planet_habitable_zone}
                </div>
              </div>
              <div>
                <span className="text-gray-400">Prebiotic UV</span>
                <div
                  className={
                    planet.planet_prebiotic_uv ? "text-[#4BE37A]" : "text-red-400"
                  }
                >
                  {planet.planet_prebiotic_uv ? "Yes" : "No"}
                </div>
              </div>
              <div>
                <span className="text-gray-400">UV Flux</span>
                <div className="text-white">
                  {planet.planet_uv_flux.toFixed(2)} W/m²
                </div>
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <span className="text-gray-400">Orbital characteristics</span>
                <div className="text-white">
                  {planet.planet_orbit_characteristics}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* habitability decay graph reused */}
        <section className="rounded-lg border border-[#6E7BAA]/20 bg-[#1A2142] p-5">
          <h2 className="mb-3 text-xl font-semibold text-[#4BE37A]">
            Habitability Over Time
          </h2>
          <p className="mb-2 text-sm text-gray-300">
            Habitability decay model: H(t) = {initialScore?.toFixed(2)}% × e^(-{decayConstant?.toFixed(2)} × t)
          </p>
          {/* slider and play controls */}
          <div className="mb-4 flex items-center gap-2">
            <button
              onClick={() => setPlaying((p) => !p)}
              className="rounded-full bg-[#4BE37A] p-2 text-[#0B1026] hover:bg-[#3BC366]"
            >
              {playing ? <span>■</span> : <span>▶</span>}
            </button>
            <input
              type="range"
              min={graphBounds.tMin}
              max={graphBounds.tMax}
              step={(graphBounds.tMax - graphBounds.tMin) / 200 || 0.01}
              value={sliderT}
              onChange={(e) => {
                setSliderT(Number(e.target.value));
              }}
              className="flex-1"
            />
            <button
              onClick={() => setSliderT(graphBounds.tMin)}
              className="rounded-full bg-[#4BE37A] p-2 text-[#0B1026] hover:bg-[#3BC366]"
            >
              ↺
            </button>
          </div>
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
          </div>
        </section>
      </main>
    </div>
  );
}
