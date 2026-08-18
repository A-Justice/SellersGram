import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { isFirebaseConfigured, publicEnv } from "./env";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let analytics: Analytics | null = null;

if (isFirebaseConfigured) {
  const config = {
    apiKey: publicEnv.firebaseApiKey,
    authDomain: publicEnv.firebaseAuthDomain,
    projectId: publicEnv.firebaseProjectId,
    storageBucket: publicEnv.firebaseStorageBucket,
    messagingSenderId: publicEnv.firebaseMessagingSenderId,
    appId: publicEnv.firebaseAppId,
    measurementId: publicEnv.firebaseMeasurementId || undefined,
  };

  app = getApps().length ? getApp() : initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  if (typeof window !== "undefined") {
    isSupported()
      .then((ok) => {
        if (ok && app) analytics = getAnalytics(app);
      })
      .catch(() => {
        analytics = null;
      });
  }
}

export { app, auth, db, storage, analytics };
