import { categoryById, subcategoryById } from "@/lib/categories";
import { REGIONS } from "@/lib/regions";
import { normalizeVideoUrlInput } from "@/lib/video-url";

export type ListingFieldErrors = Partial<Record<string, string>>;

export const LISTING_LIMITS = {
  titleMin: 3,
  titleMax: 80,
  descriptionMin: 10,
  descriptionMax: 4000,
  priceMax: 50_000_000,
  photosMin: 1,
  photosMax: 6,
} as const;

export type ListingDetailsInput = {
  title: string;
  description: string;
  categoryId: string;
  subcategoryId: string;
  condition: string;
  price: string;
  contactForPrice: boolean;
  videoUrl: string;
};

export type ListingPlaceInput = {
  regionId: string;
  city: string;
};

/** Ordered keys so scroll-to-error hits the first missing field on screen. */
export function validateListingPhotos(photoCount: number): ListingFieldErrors {
  const errors: ListingFieldErrors = {};
  if (photoCount < LISTING_LIMITS.photosMin) {
    errors.photos = "Add at least one photo.";
  } else if (photoCount > LISTING_LIMITS.photosMax) {
    errors.photos = `You can add up to ${LISTING_LIMITS.photosMax} photos.`;
  }
  return errors;
}

export function validateListingDetails(
  input: ListingDetailsInput,
): ListingFieldErrors {
  const errors: ListingFieldErrors = {};
  const title = input.title.trim();
  const description = input.description.trim();

  if (!title) {
    errors.title = "Enter a title.";
  } else if (title.length < LISTING_LIMITS.titleMin) {
    errors.title = `Title must be at least ${LISTING_LIMITS.titleMin} characters.`;
  } else if (title.length > LISTING_LIMITS.titleMax) {
    errors.title = `Title must be under ${LISTING_LIMITS.titleMax} characters.`;
  }

  if (!input.categoryId) {
    errors.categoryId = "Choose a category.";
  } else if (!categoryById(input.categoryId)) {
    errors.categoryId = "Choose a valid category.";
  }

  if (!input.subcategoryId) {
    errors.subcategoryId = "Choose a subcategory.";
  } else if (
    input.categoryId &&
    !subcategoryById(input.categoryId, input.subcategoryId)
  ) {
    errors.subcategoryId = "Choose a valid subcategory for this category.";
  }

  if (input.condition !== "new" && input.condition !== "used") {
    errors.condition = "Choose new or used.";
  }

  if (input.contactForPrice) {
    // Price optional when contacting for price.
  } else {
    const raw = input.price.trim().replace(/,/g, "");
    if (!raw) {
      errors.price = "Enter a price, or choose contact for price.";
    } else if (!/^\d+(\.\d{1,2})?$/.test(raw)) {
      errors.price = "Enter a valid price in GHS (numbers only).";
    } else {
      const amount = Number(raw);
      if (!Number.isFinite(amount) || amount <= 0) {
        errors.price = "Price must be greater than zero.";
      } else if (amount > LISTING_LIMITS.priceMax) {
        errors.price = "That price looks too high. Check the amount.";
      }
    }
  }

  if (!description) {
    errors.description = "Add a short description.";
  } else if (description.length < LISTING_LIMITS.descriptionMin) {
    errors.description = `Description must be at least ${LISTING_LIMITS.descriptionMin} characters.`;
  } else if (description.length > LISTING_LIMITS.descriptionMax) {
    errors.description = `Description must be under ${LISTING_LIMITS.descriptionMax} characters.`;
  }

  if (input.videoUrl.trim() && !normalizeVideoUrlInput(input.videoUrl)) {
    errors.videoUrl = "Enter a valid YouTube or video link.";
  }

  return errors;
}

export function validateListingPlace(input: ListingPlaceInput): ListingFieldErrors {
  const errors: ListingFieldErrors = {};
  const region = REGIONS.find((item) => item.id === input.regionId);

  if (!input.regionId) {
    errors.regionId = "Choose a region.";
  } else if (!region) {
    errors.regionId = "Choose a valid region.";
  }

  const city = input.city.trim();
  if (!city) {
    errors.city = "Choose a city.";
  } else if (region && !region.cities.includes(city)) {
    errors.city = "Choose a city in the selected region.";
  }

  return errors;
}

export function validateListingContact(hasProfilePhone: boolean): ListingFieldErrors {
  if (hasProfilePhone) return {};
  return {
    phone: "Add a phone number on your profile before submitting.",
  };
}

export function parseListingPriceGhs(
  price: string,
  contactForPrice: boolean,
): number | null {
  if (contactForPrice) return null;
  const amount = Number(price.trim().replace(/,/g, ""));
  return Number.isFinite(amount) ? amount : 0;
}

export function firstErrorKey(errors: ListingFieldErrors): string | undefined {
  return Object.keys(errors)[0];
}
