export type CategoryFieldDef = {
  id: string;
  label: string;
  type: "text" | "select" | "yesno";
  options?: { value: string; label: string }[];
  placeholder?: string;
};

const yesNoOptions = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const carMakes = [
  "Toyota",
  "Honda",
  "Hyundai",
  "Kia",
  "Mercedes-Benz",
  "BMW",
  "Nissan",
  "Ford",
  "Volkswagen",
  "Other",
].map((item) => ({ value: item.toLowerCase().replace(/\s+/g, "-"), label: item }));

const phoneBrands = ["Apple", "Samsung", "Tecno", "Infinix", "Huawei", "Other"].map((item) => ({
  value: item.toLowerCase(),
  label: item,
}));

const colors = ["Black", "White", "Silver", "Blue", "Red", "Green", "Other"].map((item) => ({
  value: item.toLowerCase(),
  label: item,
}));

const transmissions = [
  { value: "automatic", label: "Automatic" },
  { value: "manual", label: "Manual" },
];

const vehicleCarFields: CategoryFieldDef[] = [
  { id: "make", label: "Make", type: "select", options: carMakes },
  { id: "model", label: "Model", type: "text", placeholder: "e.g. Camry" },
  { id: "year", label: "Year", type: "text", placeholder: "e.g. 2019" },
  { id: "color", label: "Color", type: "select", options: colors },
  { id: "interiorColor", label: "Interior color", type: "select", options: colors },
  { id: "transmission", label: "Transmission", type: "select", options: transmissions },
  { id: "registered", label: "Registered car", type: "yesno" },
  { id: "keyFeatures", label: "Key features", type: "text", placeholder: "Leather seats, sunroof…" },
  { id: "vin", label: "VIN / chassis", type: "text", placeholder: "Optional" },
  { id: "exchangePossible", label: "Exchange possible", type: "yesno" },
];

const FIELDSETS: Record<string, CategoryFieldDef[]> = {
  "vehicles/cars": vehicleCarFields,
  "vehicles/motorbikes": [
    { id: "make", label: "Make", type: "select", options: carMakes },
    { id: "model", label: "Model", type: "text", placeholder: "e.g. Honda CB" },
    { id: "year", label: "Year", type: "text", placeholder: "e.g. 2020" },
    { id: "color", label: "Color", type: "select", options: colors },
    { id: "engineCc", label: "Engine (cc)", type: "text", placeholder: "e.g. 150" },
    { id: "registered", label: "Registered", type: "yesno" },
  ],
  "vehicles/parts": [
    { id: "partName", label: "Part name", type: "text", placeholder: "e.g. Alternator" },
    { id: "fitsVehicle", label: "Fits vehicle", type: "text", placeholder: "e.g. Toyota Corolla 2015" },
    { id: "condition", label: "Part condition", type: "select", options: [
      { value: "new", label: "New" },
      { value: "used", label: "Used" },
      { value: "refurbished", label: "Refurbished" },
    ]},
  ],
  "phones/mobile-phones": [
    { id: "brand", label: "Brand", type: "select", options: phoneBrands },
    { id: "model", label: "Model", type: "text", placeholder: "e.g. iPhone 14" },
    { id: "storage", label: "Storage", type: "select", options: ["64GB", "128GB", "256GB", "512GB", "1TB"].map((item) => ({ value: item.toLowerCase(), label: item })) },
    { id: "ram", label: "RAM", type: "text", placeholder: "e.g. 8GB" },
    { id: "color", label: "Color", type: "select", options: colors },
    { id: "network", label: "Network", type: "select", options: [
      { value: "4g", label: "4G" },
      { value: "5g", label: "5G" },
    ]},
  ],
  "phones/tablets": [
    { id: "brand", label: "Brand", type: "select", options: phoneBrands },
    { id: "model", label: "Model", type: "text" },
    { id: "storage", label: "Storage", type: "text", placeholder: "e.g. 256GB" },
    { id: "screenSize", label: "Screen size", type: "text", placeholder: 'e.g. 11"' },
  ],
  "phones/phone-accessories": [
    { id: "accessoryType", label: "Accessory type", type: "text", placeholder: "Case, charger, earbuds…" },
    { id: "compatibleWith", label: "Compatible with", type: "text", placeholder: "e.g. iPhone 15" },
  ],
  "electronics/laptops": [
    { id: "brand", label: "Brand", type: "text", placeholder: "Dell, HP, Apple…" },
    { id: "processor", label: "Processor", type: "text", placeholder: "e.g. Intel i5" },
    { id: "ram", label: "RAM", type: "text", placeholder: "e.g. 16GB" },
    { id: "storage", label: "Storage", type: "text", placeholder: "e.g. 512GB SSD" },
    { id: "screenSize", label: "Screen size", type: "text", placeholder: 'e.g. 15.6"' },
  ],
  "electronics/tvs": [
    { id: "brand", label: "Brand", type: "text" },
    { id: "screenSize", label: "Screen size", type: "text", placeholder: 'e.g. 55"' },
    { id: "displayType", label: "Display type", type: "select", options: [
      { value: "led", label: "LED" },
      { value: "oled", label: "OLED" },
      { value: "qled", label: "QLED" },
      { value: "smart", label: "Smart TV" },
    ]},
  ],
  "electronics/audio": [
    { id: "brand", label: "Brand", type: "text" },
    { id: "audioType", label: "Type", type: "text", placeholder: "Speaker, headphones…" },
    { id: "connectivity", label: "Connectivity", type: "text", placeholder: "Bluetooth, wired…" },
  ],
  "home/furniture": [
    { id: "furnitureType", label: "Item type", type: "text", placeholder: "Sofa, bed, desk…" },
    { id: "material", label: "Material", type: "text", placeholder: "Wood, fabric, leather…" },
    { id: "dimensions", label: "Dimensions", type: "text", placeholder: "L × W × H" },
    { id: "room", label: "Room", type: "text", placeholder: "Living room, bedroom…" },
  ],
  "home/appliances": [
    { id: "brand", label: "Brand", type: "text" },
    { id: "applianceType", label: "Appliance", type: "text", placeholder: "Fridge, AC, washer…" },
    { id: "capacity", label: "Capacity / size", type: "text", placeholder: "e.g. 300L" },
  ],
  "home/kitchen": [
    { id: "itemType", label: "Item type", type: "text", placeholder: "Cookware, utensils…" },
    { id: "material", label: "Material", type: "text" },
    { id: "setSize", label: "Pieces in set", type: "text", placeholder: "e.g. 12-piece" },
  ],
  "fashion/men": [
    { id: "size", label: "Size", type: "text", placeholder: "M, L, 32, etc." },
    { id: "brand", label: "Brand", type: "text" },
    { id: "itemType", label: "Item type", type: "text", placeholder: "Shirt, trousers…" },
    { id: "material", label: "Material", type: "text" },
  ],
  "fashion/women": [
    { id: "size", label: "Size", type: "text" },
    { id: "brand", label: "Brand", type: "text" },
    { id: "itemType", label: "Item type", type: "text", placeholder: "Dress, blouse…" },
    { id: "material", label: "Material", type: "text" },
  ],
  "fashion/shoes": [
    { id: "size", label: "Shoe size", type: "text", placeholder: "EU / UK size" },
    { id: "brand", label: "Brand", type: "text" },
    { id: "shoeType", label: "Type", type: "text", placeholder: "Sneakers, heels…" },
    { id: "color", label: "Color", type: "select", options: colors },
  ],
  "property/rooms": [
    { id: "bedrooms", label: "Bedrooms", type: "text", placeholder: "e.g. 1" },
    { id: "bathrooms", label: "Bathrooms", type: "text" },
    { id: "furnished", label: "Furnished", type: "yesno" },
    { id: "rentPeriod", label: "Rent period", type: "select", options: [
      { value: "monthly", label: "Monthly" },
      { value: "yearly", label: "Yearly" },
      { value: "daily", label: "Daily" },
    ]},
  ],
  "property/houses": [
    { id: "bedrooms", label: "Bedrooms", type: "text" },
    { id: "bathrooms", label: "Bathrooms", type: "text" },
    { id: "landSize", label: "Plot / land size", type: "text", placeholder: "e.g. 70×100 ft" },
    { id: "furnished", label: "Furnished", type: "yesno" },
    { id: "titleStatus", label: "Title / documents", type: "text", placeholder: "Land title, lease…" },
  ],
  "property/land": [
    { id: "landSize", label: "Land size", type: "text", placeholder: "Acres or plots" },
    { id: "landType", label: "Land type", type: "select", options: [
      { value: "residential", label: "Residential" },
      { value: "commercial", label: "Commercial" },
      { value: "agricultural", label: "Agricultural" },
    ]},
    { id: "titleStatus", label: "Title status", type: "text" },
  ],
  "beauty/makeup": [
    { id: "brand", label: "Brand", type: "text" },
    { id: "productType", label: "Product type", type: "text", placeholder: "Lipstick, foundation…" },
    { id: "shade", label: "Shade / color", type: "text" },
  ],
  "beauty/hair": [
    { id: "brand", label: "Brand", type: "text" },
    { id: "productType", label: "Product type", type: "text", placeholder: "Wig, braids, oil…" },
    { id: "length", label: "Length / size", type: "text" },
  ],
  "beauty/skincare": [
    { id: "brand", label: "Brand", type: "text" },
    { id: "productType", label: "Product type", type: "text" },
    { id: "skinType", label: "Skin type", type: "text", placeholder: "Dry, oily, sensitive…" },
  ],
  "services/repairs": [
    { id: "serviceArea", label: "What you repair", type: "text", placeholder: "Phones, cars, plumbing…" },
    { id: "experience", label: "Experience", type: "text", placeholder: "Years or background" },
    { id: "availability", label: "Availability", type: "text", placeholder: "Weekdays, weekends…" },
  ],
  "services/cleaning": [
    { id: "cleaningType", label: "Cleaning type", type: "text", placeholder: "Home, office, deep clean…" },
    { id: "availability", label: "Availability", type: "text" },
  ],
  "services/tutoring": [
    { id: "subject", label: "Subject", type: "text", placeholder: "Math, English, coding…" },
    { id: "level", label: "Level", type: "text", placeholder: "Primary, JHS, SHS…" },
    { id: "mode", label: "Mode", type: "select", options: [
      { value: "in-person", label: "In person" },
      { value: "online", label: "Online" },
      { value: "both", label: "Both" },
    ]},
  ],
  "farm/foodstuff": [
    { id: "productName", label: "Product", type: "text", placeholder: "Yam, rice, plantain…" },
    { id: "quantity", label: "Quantity", type: "text", placeholder: "Bags, crates, kg…" },
    { id: "organic", label: "Organic", type: "yesno" },
  ],
  "farm/livestock": [
    { id: "animalType", label: "Animal", type: "text", placeholder: "Goat, chicken, cattle…" },
    { id: "quantity", label: "Quantity", type: "text" },
    { id: "age", label: "Age / maturity", type: "text" },
  ],
  "farm/tools": [
    { id: "toolType", label: "Tool type", type: "text" },
    { id: "brand", label: "Brand", type: "text" },
    { id: "powerSource", label: "Power source", type: "select", options: [
      { value: "manual", label: "Manual" },
      { value: "electric", label: "Electric" },
      { value: "petrol", label: "Petrol" },
    ]},
  ],
  "pets/dogs": [
    { id: "breed", label: "Breed", type: "text" },
    { id: "age", label: "Age", type: "text" },
    { id: "sex", label: "Sex", type: "select", options: [
      { value: "male", label: "Male" },
      { value: "female", label: "Female" },
    ]},
    { id: "vaccinated", label: "Vaccinated", type: "yesno" },
  ],
  "pets/cats": [
    { id: "breed", label: "Breed", type: "text" },
    { id: "age", label: "Age", type: "text" },
    { id: "sex", label: "Sex", type: "select", options: [
      { value: "male", label: "Male" },
      { value: "female", label: "Female" },
    ]},
    { id: "vaccinated", label: "Vaccinated", type: "yesno" },
  ],
  "pets/other-pets": [
    { id: "species", label: "Species", type: "text", placeholder: "Bird, fish, rabbit…" },
    { id: "age", label: "Age", type: "text" },
    { id: "quantity", label: "Quantity", type: "text" },
  ],
};

export function fieldsForCategory(categoryId: string, subcategoryId: string) {
  return FIELDSETS[`${categoryId}/${subcategoryId}`] || [];
}

export function cleanAttributes(
  attributes: Record<string, string>,
  categoryId: string,
  subcategoryId: string,
) {
  const allowed = new Set(fieldsForCategory(categoryId, subcategoryId).map((field) => field.id));
  const cleaned: Record<string, string> = {};
  for (const [key, value] of Object.entries(attributes)) {
    const trimmed = value.trim();
    if (allowed.has(key) && trimmed) cleaned[key] = trimmed;
  }
  return cleaned;
}

export function formatAttributeValue(field: CategoryFieldDef, value: string) {
  if (field.type === "yesno") return value === "yes" ? "Yes" : value === "no" ? "No" : value;
  if (field.type === "select" && field.options) {
    return field.options.find((option) => option.value === value)?.label || value;
  }
  return value;
}

export function listingAttributeRows(
  categoryId: string,
  subcategoryId: string,
  attributes?: Record<string, string> | null,
) {
  if (!attributes) return [];
  const fields = fieldsForCategory(categoryId, subcategoryId);
  return fields
    .map((field) => {
      const raw = attributes[field.id];
      if (!raw) return null;
      return {
        id: field.id,
        label: field.label,
        value: formatAttributeValue(field, raw),
      };
    })
    .filter((row): row is { id: string; label: string; value: string } => Boolean(row));
}

export { yesNoOptions };
