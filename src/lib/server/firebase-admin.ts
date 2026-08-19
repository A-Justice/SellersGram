import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App | null = null;
let db: Firestore | null = null;

export function adminDb(): Firestore {
  if (db) return db;

  if (!getApps().length) {
    const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (json) {
      app = initializeApp({ credential: cert(JSON.parse(json)) });
    } else {
      app = initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    }
  } else {
    app = getApps()[0]!;
  }

  db = getFirestore(app);
  return db;
}

export function adminReady() {
  return Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
}
