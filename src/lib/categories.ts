export type Category = {
  id: string;
  name: string;
  hint: string;
};

export const CATEGORIES: Category[] = [
  { id: "phones", name: "Phones & Tablets", hint: "Mobiles, tablets, accessories" },
  { id: "electronics", name: "Electronics", hint: "Computers, TVs, gadgets" },
  { id: "home", name: "Home & Furniture", hint: "Sofas, kitchen, appliances" },
  { id: "fashion", name: "Fashion", hint: "Clothes, shoes, bags" },
  { id: "vehicles", name: "Vehicles", hint: "Cars, bikes, parts" },
  { id: "property", name: "Property", hint: "Rooms, houses, land" },
  { id: "beauty", name: "Health & Beauty", hint: "Makeup, hair, wellness" },
  { id: "services", name: "Services", hint: "Repairs, cleaning, tutoring" },
  { id: "farm", name: "Food & Farm", hint: "Foodstuff, livestock, tools" },
  { id: "pets", name: "Pets", hint: "Dogs, cats, and more" },
  { id: "jobs", name: "Jobs", hint: "Full-time, part-time, gigs" },
  { id: "sports", name: "Sports & Outdoors", hint: "Fitness, bikes, camping" },
  { id: "babies", name: "Babies & Kids", hint: "Toys, gear, clothing" },
  { id: "other", name: "Other", hint: "Anything that doesn’t fit above" },
];

export const SUBCATEGORIES: Record<string, { id: string; name: string }[]> = {
  phones: [
    { id: "mobile-phones", name: "Mobile phones" },
    { id: "tablets", name: "Tablets" },
    { id: "smartwatches", name: "Smartwatches" },
    { id: "phone-accessories", name: "Phone accessories" },
    { id: "phone-parts", name: "Phone parts & repair" },
    { id: "other-phones", name: "Other" },
  ],
  electronics: [
    { id: "laptops", name: "Laptops" },
    { id: "desktops", name: "Desktop computers" },
    { id: "computer-accessories", name: "Computer accessories" },
    { id: "monitors", name: "Monitors" },
    { id: "printers", name: "Printers & scanners" },
    { id: "networking", name: "Networking & Wi‑Fi" },
    { id: "tvs", name: "TVs" },
    { id: "audio", name: "Audio & headphones" },
    { id: "cameras", name: "Cameras & photography" },
    { id: "gaming", name: "Gaming consoles & games" },
    { id: "power", name: "Power banks & inverters" },
    { id: "smart-home", name: "Smart home" },
    { id: "other-electronics", name: "Other" },
  ],
  home: [
    { id: "furniture", name: "Furniture" },
    { id: "appliances", name: "Home appliances" },
    { id: "kitchen", name: "Kitchen & cookware" },
    { id: "bedding", name: "Bedding & bath" },
    { id: "decor", name: "Home decor" },
    { id: "lighting", name: "Lighting" },
    { id: "cleaning-tools", name: "Cleaning tools" },
    { id: "garden", name: "Garden & outdoor" },
    { id: "other-home", name: "Other" },
  ],
  fashion: [
    { id: "men", name: "Men’s clothing" },
    { id: "women", name: "Women’s clothing" },
    { id: "kids-fashion", name: "Kids’ clothing" },
    { id: "shoes", name: "Shoes" },
    { id: "bags", name: "Bags & luggage" },
    { id: "watches-jewelry", name: "Watches & jewelry" },
    { id: "accessories-fashion", name: "Fashion accessories" },
    { id: "underwear", name: "Underwear & sleepwear" },
    { id: "other-fashion", name: "Other" },
  ],
  vehicles: [
    { id: "cars", name: "Cars" },
    { id: "motorbikes", name: "Motorbikes" },
    { id: "tricycles", name: "Tricycles" },
    { id: "buses-vans", name: "Buses & vans" },
    { id: "trucks", name: "Trucks & commercial" },
    { id: "bicycles", name: "Bicycles" },
    { id: "parts", name: "Vehicle parts" },
    { id: "tyres", name: "Tyres & wheels" },
    { id: "car-accessories", name: "Car accessories" },
    { id: "other-vehicles", name: "Other" },
  ],
  property: [
    { id: "rooms", name: "Rooms / hostels" },
    { id: "apartments", name: "Apartments / flats" },
    { id: "houses", name: "Houses" },
    { id: "commercial", name: "Shops & offices" },
    { id: "land", name: "Land" },
    { id: "short-stay", name: "Short stay / Airbnb" },
    { id: "other-property", name: "Other" },
  ],
  beauty: [
    { id: "makeup", name: "Makeup" },
    { id: "hair", name: "Hair & wigs" },
    { id: "skincare", name: "Skincare" },
    { id: "fragrance", name: "Fragrance" },
    { id: "personal-care", name: "Personal care" },
    { id: "health", name: "Health & wellness" },
    { id: "salon-equipment", name: "Salon equipment" },
    { id: "other-beauty", name: "Other" },
  ],
  services: [
    { id: "repairs", name: "Repairs & technicians" },
    { id: "cleaning", name: "Cleaning" },
    { id: "tutoring", name: "Tutoring & lessons" },
    { id: "moving", name: "Moving & delivery" },
    { id: "events", name: "Events & entertainment" },
    { id: "beauty-services", name: "Beauty services" },
    { id: "it-services", name: "IT & design" },
    { id: "construction", name: "Building & construction" },
    { id: "other-services", name: "Other" },
  ],
  farm: [
    { id: "foodstuff", name: "Foodstuff" },
    { id: "livestock", name: "Livestock" },
    { id: "poultry", name: "Poultry" },
    { id: "fish", name: "Fish & seafood" },
    { id: "seeds-feeds", name: "Seeds & feeds" },
    { id: "tools", name: "Farm tools" },
    { id: "agro-processing", name: "Agro processing" },
    { id: "other-farm", name: "Other" },
  ],
  pets: [
    { id: "dogs", name: "Dogs" },
    { id: "cats", name: "Cats" },
    { id: "birds", name: "Birds" },
    { id: "fish-pets", name: "Fish & aquariums" },
    { id: "pet-food", name: "Pet food & supplies" },
    { id: "other-pets", name: "Other" },
  ],
  jobs: [
    { id: "full-time", name: "Full-time" },
    { id: "part-time", name: "Part-time" },
    { id: "contract", name: "Contract / freelance" },
    { id: "internships", name: "Internships" },
    { id: "domestic", name: "Domestic help" },
    { id: "other-jobs", name: "Other" },
  ],
  sports: [
    { id: "fitness", name: "Fitness & gym" },
    { id: "football", name: "Football" },
    { id: "outdoor", name: "Camping & outdoor" },
    { id: "sportswear", name: "Sportswear" },
    { id: "bikes-sports", name: "Bikes & scooters" },
    { id: "other-sports", name: "Other" },
  ],
  babies: [
    { id: "baby-gear", name: "Baby gear" },
    { id: "toys", name: "Toys & games" },
    { id: "kids-clothes", name: "Kids’ clothes" },
    { id: "school", name: "School supplies" },
    { id: "other-babies", name: "Other" },
  ],
  other: [
    { id: "general", name: "General items" },
    { id: "collectibles", name: "Collectibles" },
    { id: "office", name: "Office supplies" },
    { id: "industrial", name: "Industrial / tools" },
    { id: "other-misc", name: "Other" },
  ],
};

export function categoryById(id: string) {
  return CATEGORIES.find((category) => category.id === id);
}

export function subcategoryById(categoryId: string, subcategoryId: string) {
  return SUBCATEGORIES[categoryId]?.find((item) => item.id === subcategoryId);
}
