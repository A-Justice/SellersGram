import ghanaRegions from "@/data/ghana-regions.json";
import ghanaUniversities from "@/data/ghana-universities.json";

export const REGIONS = ghanaRegions as ReadonlyArray<{
  readonly id: string;
  readonly name: string;
  readonly cities: readonly string[];
}>;

export type RegionId = (typeof REGIONS)[number]["id"];

export type UniversityType = "public" | "public-technical" | "private";

export const UNIVERSITIES = ghanaUniversities as ReadonlyArray<{
  readonly name: string;
  readonly shortName: string;
  readonly type: UniversityType;
  readonly regionId: string;
  readonly aliases?: readonly string[];
}>;

export type PlaceOption = {
  value: string;
  label: string;
  group?: string;
  /** Extra text matched by Select search (nicknames, short names). */
  keywords?: string;
};

export function regionById(id: string) {
  return REGIONS.find((region) => region.id === id);
}

export function universitiesInRegion(regionId: string) {
  return UNIVERSITIES.filter((item) => item.regionId === regionId)
    .slice()
    .sort((a, b) =>
      (a.shortName || a.name).localeCompare(b.shortName || b.name, undefined, {
        sensitivity: "base",
      }),
    );
}

function campusLabel(item: (typeof UNIVERSITIES)[number]) {
  if (!item.shortName) return item.name;
  const withoutShort = item.name
    .replace(new RegExp(`\\s*\\(${escapeRegExp(item.shortName)}\\)\\s*$`, "i"), "")
    .trim();
  if (!withoutShort || withoutShort === item.name) return item.name;
  return `${item.shortName} — ${withoutShort}`;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function campusKeywords(item: (typeof UNIVERSITIES)[number]) {
  return [item.name, item.shortName, ...(item.aliases || [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/** True if `city` is a normal city or a campus/university in that region. */
export function isValidPlace(regionId: string, city: string) {
  const region = regionById(regionId);
  if (!region) return false;
  const place = city.trim();
  if (!place) return false;
  if (region.cities.includes(place)) return true;
  return UNIVERSITIES.some(
    (item) => item.regionId === regionId && item.name === place,
  );
}

/** City/campus options for the sell form — campuses first, then cities. */
export function placeOptionsForRegion(regionId: string): PlaceOption[] {
  const region = regionById(regionId);
  if (!region) return [];

  const campuses = universitiesInRegion(regionId).map((item) => ({
    value: item.name,
    label: campusLabel(item),
    group: "Campuses",
    keywords: campusKeywords(item),
  }));

  const cities = region.cities.map((city) => ({
    value: city,
    label: city,
    group: "Cities",
    keywords: city.toLowerCase(),
  }));

  return [...campuses, ...cities];
}
