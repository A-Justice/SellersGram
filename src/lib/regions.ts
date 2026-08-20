import ghanaRegions from "@/data/ghana-regions.json";

export const REGIONS = ghanaRegions as ReadonlyArray<{
  readonly id: string;
  readonly name: string;
  readonly cities: readonly string[];
}>;

export type RegionId = (typeof REGIONS)[number]["id"];

export function regionById(id: string) {
  return REGIONS.find((region) => region.id === id);
}
