export type ListingStatus =
  | "draft"
  | "pending"
  | "live"
  | "rejected"
  | "sold"
  | "hidden";

export type UserRole = "buyer" | "seller" | "admin";

export type Seller = {
  id: string;
  name: string;
  phone: string;
  joinedYear: number;
  rating: number;
  reviewCount: number;
  verified: boolean;
  city: string;
};

export type Listing = {
  id: string;
  title: string;
  description: string;
  priceGhs: number | null;
  negotiable: boolean;
  contactForPrice: boolean;
  categoryId: string;
  subcategoryId: string;
  condition: "new" | "used";
  regionId: string;
  city: string;
  photoUrls: string[];
  sellerId?: string;
  seller: Seller;
  status: ListingStatus;
  rejectReason?: string;
  boostedUntil: string | null;
  createdAt: string;
  publishedAt: string | null;
  embedding?: number[];
  embeddingSource?: string;
};

export type BoostPackage = {
  id: string;
  days: number;
  priceGhs: number;
  label: string;
};

export type ChatThread = {
  id: string;
  listingId: string;
  listingTitle: string;
  listingPhoto: string;
  buyerId: string;
  sellerId: string;
  buyerName: string;
  sellerName: string;
  lastMessage: string;
  updatedAt: string;
};

export type ChatMessage = {
  id: string;
  threadId: string;
  fromUid?: string;
  from: "buyer" | "seller";
  text: string;
  createdAt: string;
  editedAt?: string;
};

export type Report = {
  id: string;
  listingId: string;
  listingTitle: string;
  reason: string;
  status: "open" | "resolved";
  createdAt: string;
};

export type AppNotification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  href: string;
  type: "message" | "listing" | "system";
  threadId?: string;
  read: boolean;
  createdAt: string;
};
