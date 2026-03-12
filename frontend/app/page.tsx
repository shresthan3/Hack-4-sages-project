 "use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

const exampleStars = [
  "TRAPPIST-1",
  "Kepler-186",
  "Proxima Centauri",
  "Kepler-452",
  "TOI-700",
  "LHS 1140"
];

export default function SearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [stars, setStars] = useState<
    Array<{ x: number; y: number; size: number; opacity: number }>
  >([]);
  const suggestions = exampleStars.filter((star) =>
    star.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const generatedStars = Array.from({ length: 150 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.3
    }));
    setStars(generatedStars);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/system/${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleExampleClick = (star: string) => {
    router.push(`/system/${encodeURIComponent(star)}`);
  };

  const handleSuggestionClick = (star: string) => {
    router.push(`/system/${encodeURIComponent(star)}`);
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0B1026]">
      <div className="pointer-events-none absolute inset-0">
        {stars.map((star, index) => (
          <div
            key={index}
            className="absolute rounded-full bg-white"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-2xl px-6">
        <h1 className="mb-3 text-center text-4xl font-bold text-[#4BE37A] sm:text-5xl md:text-6xl">
          Exoplanet Habitability Explorer
        </h1>
        <p className="mb-8 text-center text-base text-gray-300 sm:text-lg md:mb-12">
          Discover potentially habitable worlds beyond our solar system
        </p>

        <form onSubmit={handleSearch} className="relative mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a star..."
              className="w-full rounded-lg border border-[#6E7BAA]/30 bg-[#1A2142] px-12 py-4 text-white placeholder-gray-400 outline-none transition-colors focus:border-[#4BE37A]"
            />
          </div>

          {searchQuery && suggestions.length > 0 && (
            <div className="absolute inset-x-0 top-full z-20 mt-2 max-h-56 overflow-y-auto rounded-lg border border-[#6E7BAA]/30 bg-[#0B1026] shadow-lg">
              {suggestions.map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleSuggestionClick(star)}
                  className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-gray-200 hover:bg-[#1A2142]"
                >
                  <span>{star}</span>
                  <span className="text-xs text-[#4BE37A]">Press Enter ↵</span>
                </button>
              ))}
            </div>
          )}
        </form>

        <p className="mb-4 text-center text-xs text-gray-400 sm:text-sm">
          Press Enter to explore • Try:{" "}
          {exampleStars.map((star, index) => (
            <span key={star}>
              <button
                type="button"
                onClick={() => handleExampleClick(star)}
                className="text-[#4BE37A] transition-all hover:underline"
              >
                {star}
              </button>
              {index < exampleStars.length - 1 && ", "}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}

