"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import type { Planet, Star } from "../data/starData";

interface StarVisualizationProps {
  star: Star;
  selectedPlanet: Planet | null;
  onPlanetClick: (planet: Planet) => void;
  onPlanetHover: (planet: Planet | null) => void;
}

export function StarVisualization({
  star,
  selectedPlanet,
  onPlanetClick,
  onPlanetHover
}: StarVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredPlanet, setHoveredPlanet] = useState<Planet | null>(null);

  const getStarColor = (spectralType: string): string => {
    const type = spectralType.charAt(0).toUpperCase();
    const colorMap: Record<string, string> = {
      O: "#9BB0FF",
      B: "#AABFFF",
      A: "#CAD7FF",
      F: "#F8F7FF",
      G: "#FFD36E",
      K: "#FFB56C",
      M: "#FF8247"
    };
    return colorMap[type] || "#FFD36E";
  };

  const getPlanetColor = (planet: Planet): string => {
    if (planet.planet_prebiotic_uv && planet.planet_habitable_zone === "Inside HZ") {
      return "#4BE37A";
    }
    if (planet.planet_habitable_zone === "Edge of HZ") {
      return "#FFD36E";
    }
    if (planet.planet_habitable_zone === "Inside HZ") {
      return "#7BE3A7";
    }
    return "#6E7BAA";
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const container = containerRef.current;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2 + offset.x;
    const centerY = canvas.height / 2 + offset.y;

    const maxOrbit = Math.max(...star.planets.map((p) => p.planet_orbit_distance));
    const pixelsPerAU =
      (Math.min(canvas.width, canvas.height) * 0.35 * scale) / maxOrbit;

    const hzInnerRadius = star.hz_inner * pixelsPerAU;
    const hzOuterRadius = star.hz_outer * pixelsPerAU;

    ctx.fillStyle = "rgba(75,227,122,0.15)";
    ctx.beginPath();
    ctx.arc(centerX, centerY, hzOuterRadius, 0, 2 * Math.PI);
    ctx.arc(centerX, centerY, hzInnerRadius, 0, 2 * Math.PI, true);
    ctx.fill();

    ctx.strokeStyle = "rgba(75,227,122,0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, hzInnerRadius, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(centerX, centerY, hzOuterRadius, 0, 2 * Math.PI);
    ctx.stroke();

    star.planets.forEach((planet) => {
      const orbitRadius = planet.planet_orbit_distance * pixelsPerAU;
      ctx.strokeStyle = "rgba(110,123,170,0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, orbitRadius, 0, 2 * Math.PI);
      ctx.stroke();
    });

    const starRadius = 15 * scale;
    const starColor = getStarColor(star.spectral_type);

    const gradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      starRadius * 3
    );
    gradient.addColorStop(0, `${starColor}AA`);
    gradient.addColorStop(0.3, `${starColor}44`);
    gradient.addColorStop(1, `${starColor}00`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, starRadius * 3, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = starColor;
    ctx.beginPath();
    ctx.arc(centerX, centerY, starRadius, 0, 2 * Math.PI);
    ctx.fill();

    star.planets.forEach((planet) => {
      const orbitRadius = planet.planet_orbit_distance * pixelsPerAU;
      const angleRad = (planet.angle * Math.PI) / 180;
      const planetX = centerX + orbitRadius * Math.cos(angleRad);
      const planetY = centerY + orbitRadius * Math.sin(angleRad);
      const planetSize = Math.max(4, Math.min(12, planet.planet_radius * 5)) * scale;

      const planetColor = getPlanetColor(planet);
      const isSelected = selectedPlanet?.id === planet.id;
      const isHovered = hoveredPlanet?.id === planet.id;

      if (isSelected || isHovered) {
        const glowGradient = ctx.createRadialGradient(
          planetX,
          planetY,
          0,
          planetX,
          planetY,
          planetSize * 3
        );
        glowGradient.addColorStop(0, `${planetColor}AA`);
        glowGradient.addColorStop(0.5, `${planetColor}44`);
        glowGradient.addColorStop(1, `${planetColor}00`);
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(planetX, planetY, planetSize * 3, 0, 2 * Math.PI);
        ctx.fill();
      }

      ctx.fillStyle = planetColor;
      ctx.beginPath();
      ctx.arc(planetX, planetY, planetSize, 0, 2 * Math.PI);
      ctx.fill();

      // draw a colored ring around planets that fall in the prebiotic UV window
      if (planet.planet_prebiotic_uv) {
        ctx.strokeStyle = "#4BE37A"; // same green used elsewhere
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(planetX, planetY, planetSize + 2, 0, 2 * Math.PI);
        ctx.stroke();
      }

      if (planet.planet_rockiness === "Rocky (textured)") {
        ctx.strokeStyle = "rgba(0,0,0,0.2)";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(planetX, planetY, planetSize, 0, 2 * Math.PI);
        ctx.stroke();
      }

      if (isSelected) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(planetX, planetY, planetSize + 3, 0, 2 * Math.PI);
        ctx.stroke();
      }
    });
  }, [star, scale, offset, selectedPlanet, hoveredPlanet]);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomSpeed = 0.001;
    const delta = -e.deltaY * zoomSpeed;
    setScale((prev) => Math.max(0.5, Math.min(3, prev + delta)));
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const centerX = canvas.width / 2 + offset.x;
    const centerY = canvas.height / 2 + offset.y;

    const maxOrbit = Math.max(...star.planets.map((p) => p.planet_orbit_distance));
    const pixelsPerAU =
      (Math.min(canvas.width, canvas.height) * 0.35 * scale) / maxOrbit;

    let foundPlanet: Planet | null = null;

    for (const planet of star.planets) {
      const orbitRadius = planet.planet_orbit_distance * pixelsPerAU;
      const angleRad = (planet.angle * Math.PI) / 180;
      const planetX = centerX + orbitRadius * Math.cos(angleRad);
      const planetY = centerY + orbitRadius * Math.sin(angleRad);
      const planetSize = Math.max(4, Math.min(12, planet.planet_radius * 5)) * scale;

      const distance = Math.hypot(mouseX - planetX, mouseY - planetY);
      if (distance <= planetSize + 5) {
        foundPlanet = planet;
        break;
      }
    }

    if (foundPlanet !== hoveredPlanet) {
      setHoveredPlanet(foundPlanet);
      onPlanetHover(foundPlanet);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const centerX = canvas.width / 2 + offset.x;
    const centerY = canvas.height / 2 + offset.y;

    const maxOrbit = Math.max(...star.planets.map((p) => p.planet_orbit_distance));
    const pixelsPerAU =
      (Math.min(canvas.width, canvas.height) * 0.35 * scale) / maxOrbit;

    for (const planet of star.planets) {
      const orbitRadius = planet.planet_orbit_distance * pixelsPerAU;
      const angleRad = (planet.angle * Math.PI) / 180;
      const planetX = centerX + orbitRadius * Math.cos(angleRad);
      const planetY = centerY + orbitRadius * Math.sin(angleRad);
      const planetSize = Math.max(4, Math.min(12, planet.planet_radius * 5)) * scale;

      const distance = Math.hypot(clickX - planetX, clickY - planetY);
      if (distance <= planetSize + 5) {
        onPlanetClick(planet);
        break;
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
    >
      <canvas ref={canvasRef} className="h-full w-full" />

      <div className="absolute right-4 top-4 flex flex-col gap-2">
        <button
          onClick={() => setScale((prev) => Math.min(3, prev + 0.2))}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#6E7BAA]/30 bg-[#1A2142] text-white transition-colors hover:bg-[#252F52]"
        >
          +
        </button>
        <button
          onClick={() => setScale((prev) => Math.max(0.5, prev - 0.2))}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#6E7BAA]/30 bg-[#1A2142] text-white transition-colors hover:bg-[#252F52]"
        >
          −
        </button>
        <button
          onClick={() => {
            setScale(1);
            setOffset({ x: 0, y: 0 });
          }}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#6E7BAA]/30 bg-[#1A2142] text-xs text-white transition-colors hover:bg-[#252F52]"
        >
          Reset
        </button>
      </div>

      <div className="absolute bottom-4 left-4 rounded-lg border border-[#6E7BAA]/30 bg-[#1A2142]/80 px-3 py-2 text-sm text-white">
        {(scale * 100).toFixed(0)}% (Full HZ View)
      </div>

      {hoveredPlanet && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-16 left-4 max-w-xs rounded-lg border border-[#6E7BAA]/30 bg-[#1A2142] p-4 text-white shadow-lg"
        >
          <h3 className="mb-2 font-semibold">{hoveredPlanet.planet_name}</h3>
          <div className="space-y-1 text-sm text-gray-300">
            <p>ESI: {hoveredPlanet.planet_esi.toFixed(2)}</p>
            <p>Prebiotic UV: {hoveredPlanet.planet_prebiotic_uv ? "Yes" : "No"}</p>
            <p>UV Flux: {hoveredPlanet.planet_uv_flux.toFixed(2)} W/m²</p>
            <p>Orbit: {hoveredPlanet.planet_orbit_distance.toFixed(4)} AU</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

