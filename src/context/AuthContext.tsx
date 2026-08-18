"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { isFirebaseConfigured } from "@/lib/env";
import { seedOwnerListings } from "@/lib/listings-store";
import { isOwnerUid } from "@/lib/owner";
import type { UserRole } from "@/data/types";

export type SessionUser = {
  uid: string;
  name: string;
  email: string | null;
  phone: string;
  role: UserRole;
};

type AuthContextValue = {
  user: SessionUser | null;
  loading: boolean;
  firebaseReady: boolean;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (name: string, email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function roleFor(uid: string, current?: string): UserRole {
  if (isOwnerUid(uid)) return "admin";
  if (current === "admin" || current === "seller" || current === "buyer") {
    return current;
  }
  return "seller";
}

async function ensureProfile(firebaseUser: User): Promise<SessionUser> {
  const base: SessionUser = {
    uid: firebaseUser.uid,
    name: firebaseUser.displayName || "Seller",
    email: firebaseUser.email,
    phone: firebaseUser.phoneNumber || "",
    role: roleFor(firebaseUser.uid),
  };

  if (!db) return base;

  const ref = doc(db, "users", firebaseUser.uid);
  const snap = await getDoc(ref);
  const existing = snap.exists() ? snap.data() : null;
  const role = roleFor(firebaseUser.uid, existing?.role);
  const profile: SessionUser = {
    uid: firebaseUser.uid,
    name: existing?.name || firebaseUser.displayName || "Seller",
    email: firebaseUser.email,
    phone: existing?.phone || firebaseUser.phoneNumber || "",
    role,
  };

  await setDoc(
    ref,
    {
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      role: profile.role,
      updatedAt: serverTimestamp(),
      ...(snap.exists() ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true },
  );

  if (isOwnerUid(profile.uid)) {
    await seedOwnerListings(profile).catch((error) => {
      console.error("Could not seed listings", error);
    });
  }

  return profile;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setUser(null);
      setLoading(false);
      return;
    }

    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      const profile = await ensureProfile(firebaseUser);
      setUser(profile);
      setLoading(false);
    });
  }, []);

  const signInEmail = useCallback(async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase is not configured yet.");
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signUpEmail = useCallback(
    async (name: string, email: string, password: string) => {
      if (!auth) throw new Error("Firebase is not configured yet.");
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
    },
    [],
  );

  const signInGoogle = useCallback(async () => {
    if (!auth) throw new Error("Firebase is not configured yet.");
    await signInWithPopup(auth, new GoogleAuthProvider());
  }, []);

  const signOut = useCallback(async () => {
    if (auth) await firebaseSignOut(auth);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      firebaseReady: isFirebaseConfigured,
      signInEmail,
      signUpEmail,
      signInGoogle,
      signOut,
    }),
    [user, loading, signInEmail, signUpEmail, signInGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
