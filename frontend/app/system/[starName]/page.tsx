"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Book } from "lucide-react";
import type { Planet, Star } from "../../../data/starData";
import { StarVisualization } from "../../../components/StarVisualization";
import { PlanetPanel } from "../../../components/PlanetPanel";
import { fetchStar } from "../../../lib/api";

export default function StarSystemPage() {
  const params = useParams<{ starName: string }>();
  const router = useRouter();
  const [star, setStar] = useState<Star | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null);
  const [showPanel, setShowPanel] = useState(true);

  useEffect(() => {
    const rawName = params?.starName;
    if (!rawName) return;

    const decoded = decodeURIComponent(rawName as string);

    fetchStar(decoded)
      .then((starData) => {
        setStar(starData);
        if (starData.planets.length > 0) {
          setSelectedPlanet(starData.planets[0]);
        }
      })
      .catch(() => {
        setError("Star not found in database.");
      });
  }, [params, router]);

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

  if (!star) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B1026]">
        <div className="text-xl text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0B1026]">
      <header className="border-b border-[#6E7BAA]/20 bg-[#0B1026] px-6 py-4">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-300 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Search</span>
          </Link>
          <Link
            href="/research"
            className="flex items-center gap-2 rounded-lg border border-[#6E7BAA]/30 bg-[#1A2142] px-4 py-2 text-white transition-colors hover:bg-[#252F52]"
          >
            <Book className="h-5 w-5" />
            <span>Further Research</span>
          </Link>
        </div>
      </header>

      <div className="relative flex-1">
        <div className="flex h-full">
          <div className="relative flex-1">
            <StarVisualization
              star={star}
              selectedPlanet={selectedPlanet}
              onPlanetClick={setSelectedPlanet}
              onPlanetHover={() => {}}
            />
          </div>

          {showPanel && (
            <div className="w-full max-w-md border-l border-[#6E7BAA]/20 bg-[#0B1026]">
              <PlanetPanel
                star={star}
                selectedPlanet={selectedPlanet}
                onPlanetSelect={setSelectedPlanet}
                onClose={() => setShowPanel(false)}
              />
            </div>
          )}
        </div>

        {!showPanel && (
          <button
            type="button"
            onClick={() => setShowPanel(true)}
            className="absolute right-4 top-4 rounded-lg border border-[#6E7BAA]/30 bg-[#1A2142] px-4 py-2 text-white transition-colors hover:bg-[#252F52]"
          >
            Show Panel
          </button>
        )}
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 hidden max-w-xs rounded-lg border border-[#6E7BAA]/30 bg-[#1A2142]/90 p-4 text-white md:block">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <span className="text-[#4BE37A]">✦</span> Legend
        </h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#4BE37A]" />
            <span className="text-gray-300">
              Inside HZ (Prebiotic UV: Yes)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#7BE3A7]" />
            <span className="text-gray-300">
              Inside HZ (Prebiotic UV: No)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#FFD36E]" />
            <span className="text-gray-300">Edge of HZ</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#6E7BAA]" />
            <span className="text-gray-300">Outside HZ</span>
          </div>
        </div>
        <div className="mt-3 space-y-1 border-t border-[#6E7BAA]/30 pt-3 text-xs text-gray-400">
          <p>
            <span className="font-semibold">Rocky (textured)</span> - Solid
            surface
          </p>
          <p>
            <span className="font-semibold">Gas Giant (smooth)</span> - Gaseous
          </p>
        </div>
      </div>
    </div>
  );
}

