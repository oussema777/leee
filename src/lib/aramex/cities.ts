import catalog from "./data/lebanon-cities.json";

export const lebanonCities: readonly string[] = catalog.cities;
const canonical = new Map(lebanonCities.map(city => [city.toLowerCase(), city]));

// Only case and surrounding whitespace may differ. Never guess a nearby city.
export function canonicalLebanonCity(value: string): string | null {
  return canonical.get(value.trim().toLowerCase()) ?? null;
}
