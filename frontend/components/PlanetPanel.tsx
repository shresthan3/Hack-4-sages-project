"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";
import type { Planet, Star } from "../data/starData";
import { Progress } from "./ui/progress";
import { motion } from "motion/react";

interface PlanetPanelProps {
  star: Star;
  selectedPlanet: Planet | null;
  onPlanetSelect: (planet: Planet) => void;
  onClose: () => void;
}

export function PlanetPanel({
  star,
  selectedPlanet,
  onPlanetSelect,
  onClose
}: PlanetPanelProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    rocky: false,
    inHZ: false,
    hasUV: false
  });

  const filteredPlanets = star.planets.filter((planet) => {
    if (filters.rocky && planet.planet_rockiness !== "Rocky (textured)") return false;
    if (filters.inHZ && planet.planet_habitable_zone === "Outside HZ") return false;
    if (filters.hasUV && !planet.planet_prebiotic_uv) return false;
    return true;
  });

  return (
    <div className="h-full overflow-y-auto border-l border-[#6E7BAA]/20 bg-[#0B1026] p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-[#4BE37A]">{star.name}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters((prev) => !prev)}
            className={`rounded-lg p-2 transition-colors ${
              showFilters
                ? "bg-[#4BE37A] text-[#0B1026]"
                : "border border-[#6E7BAA]/30 bg-[#1A2142] text-white hover:bg-[#252F52]"
            }`}
          >
            <Filter className="h-5 w-5" />
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-white lg:hidden"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-6 rounded-lg border border-[#6E7BAA]/20 bg-[#1A2142] p-4"
        >
          <h3 className="mb-3 text-sm font-semibold uppercase text-gray-400">
            Filters
          </h3>
          <div className="space-y-2">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={filters.rocky}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, rocky: e.target.checked }))
                }
                className="h-4 w-4 rounded border-[#6E7BAA]/30 bg-[#0B1026] text-[#4BE37A] focus:ring-[#4BE37A]"
              />
              <span className="text-sm text-white">Rocky Planets Only</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={filters.inHZ}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, inHZ: e.target.checked }))
                }
                className="h-4 w-4 rounded border-[#6E7BAA]/30 bg-[#0B1026] text-[#4BE37A] focus:ring-[#4BE37A]"
              />
              <span className="text-sm text-white">In Habitable Zone</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={filters.hasUV}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, hasUV: e.target.checked }))
                }
                className="h-4 w-4 rounded border-[#6E7BAA]/30 bg-[#0B1026] text-[#4BE37A] focus:ring-[#4BE37A]"
              />
              <span className="text-sm text-white">Prebiotic UV Window</span>
            </label>
          </div>
        </motion.div>
      )}

      <div className="mb-8 rounded-lg border border-[#6E7BAA]/20 bg-[#1A2142] p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase text-gray-400">
          Star Properties
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Spectral Type:</span>
            <span className="text-white">{star.spectral_type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Age:</span>
            <span className="text-white">{star.age.toFixed(1)} Gyr</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Temperature:</span>
            <span className="text-white">{star.temperature} K</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Luminosity:</span>
            <span className="text-white">{star.luminosity.toFixed(4)} L☉</span>
          </div>
        </div>
      </div>

      <div className="mb-8 rounded-lg border border-[#6E7BAA]/20 bg-[#1A2142] p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase text-gray-400">
          Habitable Zone
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Inner Boundary:</span>
            <span className="text-white">{star.hz_inner.toFixed(4)} AU</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Outer Boundary:</span>
            <span className="text-white">{star.hz_outer.toFixed(4)} AU</span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="mb-3 text-sm font-semibold uppercase text-gray-400">
          Planets ({filteredPlanets.length})
        </h3>
        <div className="space-y-2">
          {filteredPlanets.map((planet) => (
            <button
              key={planet.id}
              onClick={() => onPlanetSelect(planet)}
              className={`w-full rounded-lg border p-3 text-left text-sm transition-all ${
                selectedPlanet?.id === planet.id
                  ? "border-[#4BE37A] bg-[#4BE37A]/10"
                  : "border-[#6E7BAA]/20 bg-[#1A2142] hover:border-[#6E7BAA]/50"
              }`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="font-medium text-white">
                  {planet.planet_name}
                </span>
                <span
                  className={`rounded px-2 py-1 text-xs ${
                    planet.planet_habitable_zone === "Inside HZ"
                      ? "bg-[#4BE37A]/20 text-[#4BE37A]"
                      : planet.planet_habitable_zone === "Edge of HZ"
                      ? "bg-[#FFD36E]/20 text-[#FFD36E]"
                      : "bg-[#6E7BAA]/20 text-[#6E7BAA]"
                  }`}
                >
                  {planet.planet_habitable_zone}
                </span>
              </div>
              <div className="text-xs text-gray-400">
                {planet.planet_orbit_distance.toFixed(4)} AU •{" "}
                {planet.planet_rockiness.split(" ")[0]}
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedPlanet && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-[#6E7BAA]/20 bg-[#1A2142] p-4"
        >
          <h3 className="mb-4 text-lg font-semibold text-white">
            {selectedPlanet.planet_name}
          </h3>

          <div className="mb-4">
            <h4 className="mb-2 text-xs font-semibold uppercase text-gray-400">
              Basic Info
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Radius:</span>
                <span className="text-white">
                  {selectedPlanet.planet_radius.toFixed(2)} R⊕
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Mass:</span>
                <span className="text-white">
                  {selectedPlanet.planet_mass
                    ? `${selectedPlanet.planet_mass.toFixed(2)} M⊕`
                    : "Unknown"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Composition:</span>
                <span className="text-white">
                  {selectedPlanet.planet_rockiness.split(" ")[0]}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h4 className="mb-2 text-xs font-semibold uppercase text-gray-400">
              Orbital Info
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Distance:</span>
                <span className="text-white">
                  {selectedPlanet.planet_orbit_distance.toFixed(4)} AU
                </span>
              </div>
              <div>
                <span className="text-gray-400">Characteristics:</span>
                <p className="mt-1 text-xs text-white">
                  {selectedPlanet.planet_orbit_characteristics}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h4 className="mb-2 text-xs font-semibold uppercase text-gray-400">
              Habitability Indicators
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">HZ Status:</span>
                <span
                  className={`font-medium ${
                    selectedPlanet.planet_habitable_zone === "Inside HZ"
                      ? "text-[#4BE37A]"
                      : selectedPlanet.planet_habitable_zone === "Edge of HZ"
                      ? "text-[#FFD36E]"
                      : "text-[#6E7BAA]"
                  }`}
                >
                  {selectedPlanet.planet_habitable_zone}
                </span>
              </div>
              <div>
                <div className="mb-1 flex justify-between">
                  <span className="text-gray-400">Earth Similarity Index:</span>
                  <span className="text-white">
                    {selectedPlanet.planet_esi.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs italic text-gray-500">
                  * ESI is not 100% accurate
                </p>
              </div>
              <div>
                <div className="mb-2 flex justify-between">
                  <span className="text-gray-400">Overall Habitability:</span>
                  <span className="text-white">
                    {selectedPlanet.planet_habitability_score}%
                  </span>
                </div>
                <Progress value={selectedPlanet.planet_habitability_score} />
                <p className="mt-1 text-xs text-gray-500">ML-based score</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase text-gray-400">
              Prebiotic UV Window
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Within Window:</span>
                <span
                  className={`font-medium ${
                    selectedPlanet.planet_prebiotic_uv
                      ? "text-[#4BE37A]"
                      : "text-red-400"
                  }`}
                >
                  {selectedPlanet.planet_prebiotic_uv ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Surface UV Flux:</span>
                <span className="text-white">
                  {selectedPlanet.planet_uv_flux.toFixed(2)} W/m²
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

