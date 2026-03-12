export interface Planet {
  id: string;
  planet_name: string;
  planet_radius: number;
  planet_mass: number | null;
  planet_orbit_distance: number;
  planet_orbit_characteristics: string;
  planet_habitable_zone: "Inside HZ" | "Edge of HZ" | "Outside HZ";
  planet_esi: number;
  planet_habitability_score: number;
  planet_prebiotic_uv: boolean;
  planet_uv_flux: number;
  planet_rockiness: "Rocky (textured)" | "Gas Giant (smooth)";
  angle: number;
}

export interface Star {
  name: string;
  spectral_type: string;
  age: number;
  temperature: number;
  mass: number;
  luminosity: number;
  hz_inner: number;
  hz_outer: number;
  planets: Planet[];
}

export const starDatabase: Record<string, Star> = {
  // TRAPPIST-1
  "TRAPPIST-1": {
    name: "TRAPPIST-1",
    spectral_type: "M8V",
    age: 7.6,
    temperature: 2559,
    mass: 0.089,
    luminosity: 0.000525,
    hz_inner: 0.011,
    hz_outer: 0.021,
    planets: [
      {
        id: "trappist-1b",
        planet_name: "TRAPPIST-1 b",
        planet_radius: 1.116,
        planet_mass: 1.374,
        planet_orbit_distance: 0.01154,
        planet_orbit_characteristics: "Circular, tidally locked",
        planet_habitable_zone: "Outside HZ",
        planet_esi: 0.12,
        planet_habitability_score: 15,
        planet_prebiotic_uv: false,
        planet_uv_flux: 4.2,
        planet_rockiness: "Rocky (textured)",
        angle: 45
      },
      {
        id: "trappist-1c",
        planet_name: "TRAPPIST-1 c",
        planet_radius: 1.097,
        planet_mass: 1.308,
        planet_orbit_distance: 0.0158,
        planet_orbit_characteristics: "Circular, tidally locked",
        planet_habitable_zone: "Edge of HZ",
        planet_esi: 0.24,
        planet_habitability_score: 28,
        planet_prebiotic_uv: true,
        planet_uv_flux: 2.3,
        planet_rockiness: "Rocky (textured)",
        angle: 90
      },
      {
        id: "trappist-1d",
        planet_name: "TRAPPIST-1 d",
        planet_radius: 0.788,
        planet_mass: 0.388,
        planet_orbit_distance: 0.02227,
        planet_orbit_characteristics: "Circular, tidally locked",
        planet_habitable_zone: "Inside HZ",
        planet_esi: 0.58,
        planet_habitability_score: 62,
        planet_prebiotic_uv: true,
        planet_uv_flux: 1.2,
        planet_rockiness: "Rocky (textured)",
        angle: 135
      },
      {
        id: "trappist-1e",
        planet_name: "TRAPPIST-1 e",
        planet_radius: 0.92,
        planet_mass: 0.692,
        planet_orbit_distance: 0.02925,
        planet_orbit_characteristics: "Circular, tidally locked",
        planet_habitable_zone: "Inside HZ",
        planet_esi: 0.85,
        planet_habitability_score: 87,
        planet_prebiotic_uv: true,
        planet_uv_flux: 0.66,
        planet_rockiness: "Rocky (textured)",
        angle: 180
      },
      {
        id: "trappist-1f",
        planet_name: "TRAPPIST-1 f",
        planet_radius: 1.045,
        planet_mass: 1.039,
        planet_orbit_distance: 0.03849,
        planet_orbit_characteristics: "Circular, tidally locked",
        planet_habitable_zone: "Inside HZ",
        planet_esi: 0.68,
        planet_habitability_score: 71,
        planet_prebiotic_uv: true,
        planet_uv_flux: 0.38,
        planet_rockiness: "Rocky (textured)",
        angle: 225
      },
      {
        id: "trappist-1g",
        planet_name: "TRAPPIST-1 g",
        planet_radius: 1.129,
        planet_mass: 1.321,
        planet_orbit_distance: 0.04683,
        planet_orbit_characteristics: "Circular, tidally locked",
        planet_habitable_zone: "Edge of HZ",
        planet_esi: 0.47,
        planet_habitability_score: 51,
        planet_prebiotic_uv: false,
        planet_uv_flux: 0.26,
        planet_rockiness: "Rocky (textured)",
        angle: 270
      },
      {
        id: "trappist-1h",
        planet_name: "TRAPPIST-1 h",
        planet_radius: 0.755,
        planet_mass: 0.326,
        planet_orbit_distance: 0.06189,
        planet_orbit_characteristics: "Circular, tidally locked",
        planet_habitable_zone: "Outside HZ",
        planet_esi: 0.19,
        planet_habitability_score: 22,
        planet_prebiotic_uv: false,
        planet_uv_flux: 0.14,
        planet_rockiness: "Rocky (textured)",
        angle: 315
      }
    ]
  },
  // Proxima Centauri
  "Proxima Centauri": {
    name: "Proxima Centauri",
    spectral_type: "M5.5Ve",
    age: 4.85,
    temperature: 3042,
    mass: 0.122,
    luminosity: 0.0017,
    hz_inner: 0.0423,
    hz_outer: 0.0816,
    planets: [
      {
        id: "proxima-b",
        planet_name: "Proxima Centauri b",
        planet_radius: 1.07,
        planet_mass: 1.27,
        planet_orbit_distance: 0.0485,
        planet_orbit_characteristics: "Low eccentricity, likely tidally locked",
        planet_habitable_zone: "Inside HZ",
        planet_esi: 0.87,
        planet_habitability_score: 84,
        planet_prebiotic_uv: true,
        planet_uv_flux: 0.65,
        planet_rockiness: "Rocky (textured)",
        angle: 120
      },
      {
        id: "proxima-d",
        planet_name: "Proxima Centauri d",
        planet_radius: 0.81,
        planet_mass: 0.26,
        planet_orbit_distance: 0.02885,
        planet_orbit_characteristics: "Circular",
        planet_habitable_zone: "Outside HZ",
        planet_esi: 0.23,
        planet_habitability_score: 18,
        planet_prebiotic_uv: false,
        planet_uv_flux: 2.8,
        planet_rockiness: "Rocky (textured)",
        angle: 240
      }
    ]
  },
  // Kepler-186
  "Kepler-186": {
    name: "Kepler-186",
    spectral_type: "M1V",
    age: 4.0,
    temperature: 3788,
    mass: 0.544,
    luminosity: 0.05,
    hz_inner: 0.22,
    hz_outer: 0.4,
    planets: [
      {
        id: "kepler-186b",
        planet_name: "Kepler-186 b",
        planet_radius: 1.07,
        planet_mass: null,
        planet_orbit_distance: 0.0343,
        planet_orbit_characteristics: "Circular",
        planet_habitable_zone: "Outside HZ",
        planet_esi: 0.09,
        planet_habitability_score: 8,
        planet_prebiotic_uv: false,
        planet_uv_flux: 12.5,
        planet_rockiness: "Rocky (textured)",
        angle: 30
      },
      {
        id: "kepler-186c",
        planet_name: "Kepler-186 c",
        planet_radius: 1.25,
        planet_mass: null,
        planet_orbit_distance: 0.0451,
        planet_orbit_characteristics: "Circular",
        planet_habitable_zone: "Outside HZ",
        planet_esi: 0.11,
        planet_habitability_score: 12,
        planet_prebiotic_uv: false,
        planet_uv_flux: 7.2,
        planet_rockiness: "Rocky (textured)",
        angle: 80
      },
      {
        id: "kepler-186d",
        planet_name: "Kepler-186 d",
        planet_radius: 1.4,
        planet_mass: null,
        planet_orbit_distance: 0.0781,
        planet_orbit_characteristics: "Circular",
        planet_habitable_zone: "Outside HZ",
        planet_esi: 0.14,
        planet_habitability_score: 16,
        planet_prebiotic_uv: false,
        planet_uv_flux: 2.4,
        planet_rockiness: "Rocky (textured)",
        angle: 130
      },
      {
        id: "kepler-186e",
        planet_name: "Kepler-186 e",
        planet_radius: 1.27,
        planet_mass: null,
        planet_orbit_distance: 0.11,
        planet_orbit_characteristics: "Circular",
        planet_habitable_zone: "Outside HZ",
        planet_esi: 0.19,
        planet_habitability_score: 21,
        planet_prebiotic_uv: false,
        planet_uv_flux: 1.2,
        planet_rockiness: "Rocky (textured)",
        angle: 180
      },
      {
        id: "kepler-186f",
        planet_name: "Kepler-186 f",
        planet_radius: 1.11,
        planet_mass: null,
        planet_orbit_distance: 0.356,
        planet_orbit_characteristics: "Low eccentricity",
        planet_habitable_zone: "Inside HZ",
        planet_esi: 0.64,
        planet_habitability_score: 68,
        planet_prebiotic_uv: true,
        planet_uv_flux: 0.29,
        planet_rockiness: "Rocky (textured)",
        angle: 280
      }
    ]
  },
  // Kepler-452
  "Kepler-452": {
    name: "Kepler-452",
    spectral_type: "G2V",
    age: 6.0,
    temperature: 5757,
    mass: 1.04,
    luminosity: 1.2,
    hz_inner: 1.05,
    hz_outer: 1.46,
    planets: [
      {
        id: "kepler-452b",
        planet_name: "Kepler-452 b",
        planet_radius: 1.63,
        planet_mass: 5,
        planet_orbit_distance: 1.046,
        planet_orbit_characteristics: "Near-circular, 385-day period",
        planet_habitable_zone: "Inside HZ",
        planet_esi: 0.83,
        planet_habitability_score: 82,
        planet_prebiotic_uv: true,
        planet_uv_flux: 1.1,
        planet_rockiness: "Rocky (textured)",
        angle: 90
      }
    ]
  },
  // TOI-700
  "TOI-700": {
    name: "TOI-700",
    spectral_type: "M2V",
    age: 1.5,
    temperature: 3480,
    mass: 0.415,
    luminosity: 0.0233,
    hz_inner: 0.134,
    hz_outer: 0.259,
    planets: [
      {
        id: "toi-700b",
        planet_name: "TOI-700 b",
        planet_radius: 1.04,
        planet_mass: null,
        planet_orbit_distance: 0.0963,
        planet_orbit_characteristics: "Circular",
        planet_habitable_zone: "Outside HZ",
        planet_esi: 0.15,
        planet_habitability_score: 12,
        planet_prebiotic_uv: false,
        planet_uv_flux: 4.8,
        planet_rockiness: "Rocky (textured)",
        angle: 60
      },
      {
        id: "toi-700c",
        planet_name: "TOI-700 c",
        planet_radius: 2.63,
        planet_mass: null,
        planet_orbit_distance: 0.163,
        planet_orbit_characteristics: "Circular",
        planet_habitable_zone: "Inside HZ",
        planet_esi: 0.36,
        planet_habitability_score: 42,
        planet_prebiotic_uv: true,
        planet_uv_flux: 1.72,
        planet_rockiness: "Gas Giant (smooth)",
        angle: 150
      },
      {
        id: "toi-700d",
        planet_name: "TOI-700 d",
        planet_radius: 1.19,
        planet_mass: null,
        planet_orbit_distance: 0.163,
        planet_orbit_characteristics: "Circular, tidally locked",
        planet_habitable_zone: "Inside HZ",
        planet_esi: 0.72,
        planet_habitability_score: 76,
        planet_prebiotic_uv: true,
        planet_uv_flux: 0.86,
        planet_rockiness: "Rocky (textured)",
        angle: 240
      }
    ]
  },
  // LHS 1140
  "LHS 1140": {
    name: "LHS 1140",
    spectral_type: "M4.5V",
    age: 5.0,
    temperature: 3131,
    mass: 0.146,
    luminosity: 0.00462,
    hz_inner: 0.066,
    hz_outer: 0.127,
    planets: [
      {
        id: "lhs-1140b",
        planet_name: "LHS 1140 b",
        planet_radius: 1.73,
        planet_mass: 6.98,
        planet_orbit_distance: 0.0875,
        planet_orbit_characteristics: "Low eccentricity",
        planet_habitable_zone: "Inside HZ",
        planet_esi: 0.71,
        planet_habitability_score: 74,
        planet_prebiotic_uv: true,
        planet_uv_flux: 0.46,
        planet_rockiness: "Rocky (textured)",
        angle: 180
      },
      {
        id: "lhs-1140c",
        planet_name: "LHS 1140 c",
        planet_radius: 1.28,
        planet_mass: 1.81,
        planet_orbit_distance: 0.028,
        planet_orbit_characteristics: "Circular",
        planet_habitable_zone: "Outside HZ",
        planet_esi: 0.17,
        planet_habitability_score: 19,
        planet_prebiotic_uv: false,
        planet_uv_flux: 5.9,
        planet_rockiness: "Rocky (textured)",
        angle: 45
      }
    ]
  }
};

export function getStarData(starName: string): Star | null {
  const normalizedName = starName.trim();

  if (starDatabase[normalizedName]) {
    return starDatabase[normalizedName];
  }

  const foundKey = Object.keys(starDatabase).find(
    (key) => key.toLowerCase() === normalizedName.toLowerCase()
  );

  return foundKey ? starDatabase[foundKey] : null;
}

