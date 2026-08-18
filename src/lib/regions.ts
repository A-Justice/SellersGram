export const REGIONS = [
  {
    id: "greater-accra",
    name: "Greater Accra",
    cities: ["Accra", "Tema", "Madina", "Kasoa", "Ashaiman", "East Legon"],
  },
  {
    id: "ashanti",
    name: "Ashanti",
    cities: ["Kumasi", "Obuasi", "Ejisu", "Konongo"],
  },
  {
    id: "western",
    name: "Western",
    cities: ["Takoradi", "Sekondi", "Tarkwa"],
  },
  {
    id: "central",
    name: "Central",
    cities: ["Cape Coast", "Winneba", "Mankessim"],
  },
  {
    id: "eastern",
    name: "Eastern",
    cities: ["Koforidua", "Nkawkaw", "Akosombo"],
  },
  {
    id: "volta",
    name: "Volta",
    cities: ["Ho", "Hohoe", "Aflao"],
  },
  {
    id: "northern",
    name: "Northern",
    cities: ["Tamale", "Yendi"],
  },
  {
    id: "upper-east",
    name: "Upper East",
    cities: ["Bolgatanga", "Bawku", "Navrongo"],
  },
  {
    id: "upper-west",
    name: "Upper West",
    cities: ["Wa"],
  },
  {
    id: "bono",
    name: "Bono",
    cities: ["Sunyani", "Berekum"],
  },
  {
    id: "bono-east",
    name: "Bono East",
    cities: ["Techiman", "Kintampo"],
  },
  {
    id: "ahafo",
    name: "Ahafo",
    cities: ["Goaso", "Hwidiem"],
  },
  {
    id: "western-north",
    name: "Western North",
    cities: ["Sefwi Wiawso", "Bibiani"],
  },
  {
    id: "oti",
    name: "Oti",
    cities: ["Dambai", "Jasikan"],
  },
  {
    id: "savannah",
    name: "Savannah",
    cities: ["Damongo", "Bole"],
  },
  {
    id: "north-east",
    name: "North East",
    cities: ["Nalerigu", "Walewale"],
  },
] as const;

export type RegionId = (typeof REGIONS)[number]["id"];

export function regionById(id: string) {
  return REGIONS.find((region) => region.id === id);
}
