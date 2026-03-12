"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ResearchPage() {
  return (
    <div className="min-h-screen bg-[#0B1026]">
      <header className="sticky top-0 z-10 border-b border-[#6E7BAA]/20 bg-[#0B1026] px-6 py-4">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-300 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Explorer</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="mb-3 text-4xl font-bold text-[#4BE37A]">
          Further Research
        </h1>
        <p className="mb-8 text-gray-300">
          Explore the key factors that determine whether a planet can support
          life as we know it.
        </p>

        <div className="space-y-4">
          <div className="rounded-lg border border-[#6E7BAA]/20 bg-[#1A2142] px-6">
            <details>
              <summary className="cursor-pointer py-4 text-white transition-colors hover:text-[#4BE37A]">
                Magnetospheres
              </summary>
              <div className="space-y-3 pb-4 text-gray-300">
                <p>
                  A magnetosphere is a region of space around a planet where
                  the planet's magnetic field dominates over the solar wind.
                </p>
                <p>
                  It acts as a shield, protecting the planet from harmful
                  cosmic radiation and solar wind particles that could strip
                  away the atmosphere.
                </p>
                <p>
                  Planets with strong magnetospheres like Earth are better
                  protected, which is crucial for maintaining atmospheric
                  pressure and protecting surface life from radiation.
                </p>
                <p>
                  Mars lost much of its atmosphere after its magnetic field
                  weakened, demonstrating the importance of magnetospheric
                  protection for long-term habitability.
                </p>
              </div>
            </details>
          </div>

          <div className="rounded-lg border border-[#6E7BAA]/20 bg-[#1A2142] px-6">
            <details>
              <summary className="cursor-pointer py-4 text-white transition-colors hover:text-[#4BE37A]">
                Atmospheric Composition
              </summary>
              <div className="space-y-3 pb-4 text-gray-300">
                <p>
                  The presence of greenhouse gases like CO2, methane, and water
                  vapor helps regulate surface temperature through the
                  greenhouse effect.
                </p>
                <p>
                  Oxygen (O2) and nitrogen (N2) are key components of
                  breathable atmospheres, though high oxygen levels can also
                  indicate photosynthetic life.
                </p>
                <p>
                  The atmospheric pressure must be sufficient to allow liquid
                  water to exist on the surface - too thin and water
                  evaporates, too thick and the greenhouse effect becomes
                  extreme.
                </p>
                <p>
                  Atmospheric composition can be detected through spectroscopy,
                  allowing us to analyze exoplanet atmospheres from light-years
                  away.
                </p>
              </div>
            </details>
          </div>

          <div className="rounded-lg border border-[#6E7BAA]/20 bg-[#1A2142] px-6">
            <details>
              <summary className="cursor-pointer py-4 text-white transition-colors hover:text-[#4BE37A]">
                Stellar Radiation & UV Flux
              </summary>
              <div className="space-y-3 pb-4 text-gray-300">
                <p>
                  The "prebiotic UV window" refers to the optimal range of
                  ultraviolet radiation that can drive prebiotic chemistry
                  without being harmful to early life.
                </p>
                <p>
                  Too much UV radiation can break down organic molecules and
                  damage DNA, while too little may not provide enough energy
                  for chemical reactions needed for life.
                </p>
                <p>
                  Stars cooler than the Sun (like M-dwarfs) emit less UV
                  radiation, which might affect the development of early life
                  chemistry.
                </p>
                <p>
                  Planets need to balance receiving enough UV for chemical
                  synthesis while having atmospheric protection from
                  excessive radiation.
                </p>
              </div>
            </details>
          </div>

          <div className="rounded-lg border border-[#6E7BAA]/20 bg-[#1A2142] px-6">
            <details>
              <summary className="cursor-pointer py-4 text-white transition-colors hover:text-[#4BE37A]">
                Planetary Mass & Gravity
              </summary>
              <div className="space-y-3 pb-4 text-gray-300">
                <p>
                  Planetary mass determines surface gravity, which affects
                  atmospheric retention - more massive planets hold onto
                  their atmospheres better.
                </p>
                <p>
                  Too much gravity could make the planet a "super-Earth" with
                  thick hydrogen atmospheres, while too little allows
                  atmospheric escape.
                </p>
                <p>
                  Surface gravity affects the evolution of life forms -
                  higher gravity requires stronger skeletal structures, while
                  lower gravity allows more varied morphologies.
                </p>
                <p>
                  The mass-radius relationship helps us determine if a planet
                  is rocky (like Earth) or gaseous (like Neptune).
                </p>
              </div>
            </details>
          </div>

          <div className="rounded-lg border border-[#6E7BAA]/20 bg-[#1A2142] px-6">
            <details>
              <summary className="cursor-pointer py-4 text-white transition-colors hover:text-[#4BE37A]">
                Orbital Characteristics
              </summary>
              <div className="space-y-3 pb-4 text-gray-300">
                <p>
                  Orbital eccentricity measures how elliptical an orbit is -
                  highly eccentric orbits cause extreme seasonal temperature
                  variations.
                </p>
                <p>
                  Tidal locking occurs when a planet always shows the same
                  face to its star, creating permanent day and night sides with
                  extreme temperature differences.
                </p>
                <p>
                  The orbital period determines the length of a year - planets
                  in habitable zones of cooler stars have much shorter years.
                </p>
                <p>
                  Orbital resonances with other planets can stabilize or
                  destabilize planetary systems over long timescales.
                </p>
              </div>
            </details>
          </div>

          <div className="rounded-lg border border-[#6E7BAA]/20 bg-[#1A2142] px-6">
            <details>
              <summary className="cursor-pointer py-4 text-white transition-colors hover:text-[#4BE37A]">
                Surface Temperature & Climate
              </summary>
              <div className="space-y-3 pb-4 text-gray-300">
                <p>
                  The habitable zone is defined by the distance range where
                  liquid water can exist on a planet's surface, typically
                  between 0°C and 100°C.
                </p>
                <p>
                  Surface temperature is determined by stellar radiation,
                  atmospheric composition, albedo (reflectivity), and
                  internal heat.
                </p>
                <p>
                  Climate stability over geological timescales is crucial for
                  the development of complex life - extreme fluctuations can
                  cause mass extinctions.
                </p>
                <p>
                  The carbonate-silicate cycle on Earth acts as a planetary
                  thermostat, regulating CO2 levels and maintaining stable
                  temperatures over millions of years.
                </p>
              </div>
            </details>
          </div>

          <div className="rounded-lg border border-[#6E7BAA]/20 bg-[#1A2142] px-6">
            <details>
              <summary className="cursor-pointer py-4 text-white transition-colors hover:text-[#4BE37A]">
                Water Presence
              </summary>
              <div className="space-y-3 pb-4 text-gray-300">
                <p>
                  Liquid water is considered essential for life as we know it,
                  serving as a solvent for biochemical reactions.
                </p>
                <p>
                  Water can exist on a planet's surface, in subsurface oceans
                  (like on Europa and Enceladus), or in atmospheric clouds.
                </p>
                <p>
                  The presence of water vapor in an atmosphere can be
                  detected through spectroscopic analysis of starlight
                  passing through the atmosphere.
                </p>
                <p>
                  Too much water could create "ocean worlds" with no exposed
                  land, while too little could create arid desert planets -
                  both extremes may limit habitability.
                </p>
              </div>
            </details>
          </div>

          <div className="rounded-lg border border-[#6E7BAA]/20 bg-[#1A2142] px-6">
            <details>
              <summary className="cursor-pointer py-4 text-white transition-colors hover:text-[#4BE37A]">
                Planetary Geology & Volcanism
              </summary>
              <div className="space-y-3 pb-4 text-gray-300">
                <p>
                  Plate tectonics recycle nutrients and regulate atmospheric
                  composition through the carbonate-silicate cycle.
                </p>
                <p>
                  Volcanic activity releases gases that replenish the
                  atmosphere and create new land surfaces.
                </p>
                <p>
                  Internal heat from radioactive decay and gravitational
                  differentiation drives geological activity.
                </p>
                <p>
                  Geologically dead planets (like Mars) may lose their
                  habitability over time as they can't recycle carbon dioxide
                  or maintain magnetic fields.
                </p>
              </div>
            </details>
          </div>

          <div className="rounded-lg border border-[#6E7BAA]/20 bg-[#1A2142] px-6">
            <details>
              <summary className="cursor-pointer py-4 text-white transition-colors hover:text-[#4BE37A]">
                About This Tool
              </summary>
              <div className="space-y-3 pb-4 text-gray-300">
                <p>
                  The Exoplanet Habitability Explorer uses data from confirmed
                  exoplanets and applies various habitability metrics
                  including Earth Similarity Index (ESI), habitable zone
                  analysis, and machine learning-based habitability scores.
                </p>
                <p>
                  Data sources include NASA Exoplanet Archive, planetary
                  science research, and habitability assessment models. All
                  habitability scores are estimates based on current
                  scientific understanding and should be interpreted with
                  appropriate uncertainty.
                </p>
              </div>
            </details>
          </div>
        </div>

        <div className="mt-12 border-t border-[#6E7BAA]/20 pt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-[#4BE37A] px-6 py-3 font-semibold text-[#0B1026] transition-colors hover:bg-[#3BC366]"
          >
            Return to Exoplanet Explorer
          </Link>
        </div>
      </main>
    </div>
  );
}

