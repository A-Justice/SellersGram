export type Category = {
  id: string;
  name: string;
  hint: string;
};

export const CATEGORIES: Category[] = [
  { id: "phones", name: "Phones & Tablets", hint: "Mobiles, tablets, accessories" },
  { id: "electronics", name: "Electronics", hint: "TVs, laptops, audio" },
  { id: "home", name: "Home & Furniture", hint: "Sofas, kitchen, appliances" },
  { id: "fashion", name: "Fashion", hint: "Clothes, shoes, bags" },
  { id: "vehicles", name: "Vehicles", hint: "Cars, bikes, parts" },
  { id: "property", name: "Property", hint: "Rooms, houses, land" },
  { id: "beauty", name: "Beauty", hint: "Makeup, hair, skincare" },
  { id: "services", name: "Services", hint: "Repairs, cleaning, tutoring" },
  { id: "farm", name: "Food & Farm", hint: "Foodstuff, livestock, tools" },
  { id: "pets", name: "Pets", hint: "Dogs, cats, and more" },
];

export const SUBCATEGORIES: Record<string, { id: string; name: string }[]> = {
  phones: [
    { id: "mobile-phones", name: "Mobile phones" },
    { id: "tablets", name: "Tablets" },
    { id: "phone-accessories", name: "Accessories" },
  ],
  electronics: [
    { id: "laptops", name: "Laptops" },
    { id: "tvs", name: "TVs" },
    { id: "audio", name: "Audio" },
  ],
  home: [
    { id: "furniture", name: "Furniture" },
    { id: "appliances", name: "Appliances" },
    { id: "kitchen", name: "Kitchen" },
  ],
  fashion: [
    { id: "men", name: "Men" },
    { id: "women", name: "Women" },
    { id: "shoes", name: "Shoes" },
  ],
  vehicles: [
    { id: "cars", name: "Cars" },
    { id: "motorbikes", name: "Motorbikes" },
    { id: "parts", name: "Parts" },
  ],
  property: [
    { id: "rooms", name: "Rooms" },
    { id: "houses", name: "Houses" },
    { id: "land", name: "Land" },
  ],
  beauty: [
    { id: "makeup", name: "Makeup" },
    { id: "hair", name: "Hair" },
    { id: "skincare", name: "Skincare" },
  ],
  services: [
    { id: "repairs", name: "Repairs" },
    { id: "cleaning", name: "Cleaning" },
    { id: "tutoring", name: "Tutoring" },
  ],
  farm: [
    { id: "foodstuff", name: "Foodstuff" },
    { id: "livestock", name: "Livestock" },
    { id: "tools", name: "Farm tools" },
  ],
  pets: [
    { id: "dogs", name: "Dogs" },
    { id: "cats", name: "Cats" },
    { id: "other-pets", name: "Other pets" },
  ],
};

export function categoryById(id: string) {
  return CATEGORIES.find((category) => category.id === id);
}
