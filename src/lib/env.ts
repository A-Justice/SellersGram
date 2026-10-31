export const publicEnv = {
  firebaseApiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  firebaseAuthDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  firebaseProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  firebaseStorageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  firebaseMessagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  firebaseAppId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  firebaseMeasurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
  /** Firestore database id. `(default)` = production; `test` = test backend. */
  firestoreDatabase: (process.env.NEXT_PUBLIC_FIRESTORE_DATABASE || "(default)").trim() || "(default)",
  paystackPublicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
};

export const isFirebaseConfigured = Boolean(
  publicEnv.firebaseApiKey && publicEnv.firebaseProjectId,
);

export function isDefaultFirestoreDatabase(databaseId = publicEnv.firestoreDatabase) {
  return !databaseId || databaseId === "(default)";
}

/** Hosts Google / Bing are allowed to index. Everything else (test, preview, localhost) is noindex. */
const INDEXABLE_HOSTS = new Set(["vendorsgram.com", "www.vendorsgram.com"]);

export function isIndexableHost(hostname: string) {
  const host = hostname.toLowerCase().split(":")[0]?.replace(/\.$/, "") || "";
  return INDEXABLE_HOSTS.has(host);
}

/** True only when this deploy's public URL is production. */
export function isProductionSite(appUrl = publicEnv.appUrl) {
  try {
    return isIndexableHost(new URL(appUrl).hostname);
  } catch {
    return false;
  }
}
