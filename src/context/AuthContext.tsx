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
  RecaptchaVerifier,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type ConfirmationResult,
  type User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { isFirebaseConfigured } from "@/lib/env";
import { seedOwnerListings } from "@/lib/listings-store";
import { isOwnerUid } from "@/lib/owner";
import { toE164Phone } from "@/lib/phone";
import type { UserRole } from "@/data/types";

export type SessionUser = {
  uid: string;
  name: string;
  email: string | null;
  phone: string;
  instagram: string;
  role: UserRole;
};

export type ProfileUpdates = {
  name: string;
  phone: string;
  email: string;
  instagram: string;
};

type AuthContextValue = {
  user: SessionUser | null;
  loading: boolean;
  firebaseReady: boolean;
  /** Phone user signed in but has no name/shop name yet. */
  needsName: boolean;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (name: string, email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  startPhoneSignIn: (phone: string) => Promise<string>;
  confirmPhoneCode: (code: string) => Promise<{ needsName: boolean }>;
  completeProfileName: (name: string) => Promise<void>;
  updateAccountProfile: (updates: ProfileUpdates) => Promise<void>;
  clearPhoneSignIn: () => void;
  signOut: () => Promise<void>;
};

const PHONE_RECAPTCHA_ID = "phone-recaptcha";

let phoneConfirmation: ConfirmationResult | null = null;
let phoneRecaptcha: RecaptchaVerifier | null = null;

function clearPhoneRecaptcha() {
  if (phoneRecaptcha) {
    phoneRecaptcha.clear();
    phoneRecaptcha = null;
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeInstagram(input: string) {
  let handle = input.trim();
  if (!handle) return "";
  handle = handle.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "");
  handle = handle.replace(/\/.*$/, "");
  handle = handle.replace(/^@/, "");
  handle = handle.replace(/[^a-zA-Z0-9._]/g, "");
  return handle.slice(0, 30);
}

function roleFor(uid: string, current?: string): UserRole {
  if (isOwnerUid(uid)) return "admin";
  if (current === "admin" || current === "seller" || current === "buyer") {
    return current;
  }
  return "seller";
}

function profileNeedsName(firebaseUser: User, existingName?: string | null) {
  if (!firebaseUser.phoneNumber) return false;
  const name = String(existingName || firebaseUser.displayName || "").trim();
  return !name || name === "Seller";
}

async function ensureProfile(firebaseUser: User): Promise<{
  profile: SessionUser;
  needsName: boolean;
}> {
  const authPhone = firebaseUser.phoneNumber || "";

  if (!db) {
    const name = String(firebaseUser.displayName || "").trim();
    const needsName = Boolean(authPhone) && (!name || name === "Seller");
    return {
      profile: {
        uid: firebaseUser.uid,
        name: needsName ? "" : name || "Seller",
        email: firebaseUser.email,
        phone: authPhone,
        instagram: "",
        role: roleFor(firebaseUser.uid),
      },
      needsName,
    };
  }

  const ref = doc(db, "users", firebaseUser.uid);
  const snap = await getDoc(ref);
  const existing = snap.exists() ? snap.data() : null;
  const role = roleFor(firebaseUser.uid, existing?.role);
  const needsName = profileNeedsName(firebaseUser, existing?.name);
  const name = needsName
    ? ""
    : String(existing?.name || firebaseUser.displayName || "Seller").trim();

  const profile: SessionUser = {
    uid: firebaseUser.uid,
    name,
    email: (existing?.email as string | null | undefined) ?? firebaseUser.email,
    phone: String(existing?.phone || authPhone || ""),
    instagram: normalizeInstagram(String(existing?.instagram || "")),
    role,
  };

  await setDoc(
    ref,
    {
      ...(needsName ? {} : { name: profile.name }),
      email: profile.email,
      phone: profile.phone,
      instagram: profile.instagram || null,
      role: profile.role,
      updatedAt: serverTimestamp(),
      ...(snap.exists() ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true },
  );

  if (!needsName && isOwnerUid(profile.uid)) {
    await seedOwnerListings(profile).catch((error) => {
      console.error("Could not seed listings", error);
    });
  }

  return { profile, needsName };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsName, setNeedsName] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setUser(null);
      setNeedsName(false);
      setLoading(false);
      return;
    }

    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setNeedsName(false);
        setLoading(false);
        return;
      }
      const result = await ensureProfile(firebaseUser);
      setUser(result.profile);
      setNeedsName(result.needsName);
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
      await updateProfile(cred.user, { displayName: name.trim() });
    },
    [],
  );

  const signInGoogle = useCallback(async () => {
    if (!auth) throw new Error("Firebase is not configured yet.");
    await signInWithPopup(auth, new GoogleAuthProvider());
  }, []);

  const clearPhoneSignIn = useCallback(() => {
    phoneConfirmation = null;
    clearPhoneRecaptcha();
  }, []);

  const startPhoneSignIn = useCallback(async (phone: string) => {
    if (!auth) throw new Error("Firebase is not configured yet.");
    if (typeof window === "undefined") {
      throw new Error("Phone sign-in only works in the browser.");
    }

    const e164 = toE164Phone(phone);
    clearPhoneRecaptcha();
    phoneConfirmation = null;

    phoneRecaptcha = new RecaptchaVerifier(auth, PHONE_RECAPTCHA_ID, {
      size: "invisible",
    });

    try {
      phoneConfirmation = await signInWithPhoneNumber(auth, e164, phoneRecaptcha);
      return e164;
    } catch (error) {
      clearPhoneRecaptcha();
      phoneConfirmation = null;
      throw error;
    }
  }, []);

  const confirmPhoneCode = useCallback(async (code: string) => {
    if (!phoneConfirmation) {
      throw new Error("Request a verification code first.");
    }
    const trimmed = code.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      throw new Error("Enter the 6-digit code from SMS.");
    }
    const cred = await phoneConfirmation.confirm(trimmed);
    phoneConfirmation = null;
    clearPhoneRecaptcha();

    const result = await ensureProfile(cred.user);
    setUser(result.profile);
    setNeedsName(result.needsName);
    setLoading(false);
    return { needsName: result.needsName };
  }, []);

  const completeProfileName = useCallback(async (rawName: string) => {
    if (!auth?.currentUser) throw new Error("Sign in again to finish your profile.");
    const name = rawName.trim();
    if (name.length < 2) throw new Error("Enter your name or shop name.");

    await updateProfile(auth.currentUser, { displayName: name });

    if (db) {
      await setDoc(
        doc(db, "users", auth.currentUser.uid),
        {
          name,
          phone: auth.currentUser.phoneNumber || "",
          email: auth.currentUser.email,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    }

    setUser((current) =>
      current
        ? { ...current, name, phone: auth!.currentUser!.phoneNumber || current.phone }
        : {
            uid: auth!.currentUser!.uid,
            name,
            email: auth!.currentUser!.email,
            phone: auth!.currentUser!.phoneNumber || "",
            instagram: "",
            role: roleFor(auth!.currentUser!.uid),
          },
    );
    setNeedsName(false);

    if (isOwnerUid(auth.currentUser.uid)) {
      const profile: SessionUser = {
        uid: auth.currentUser.uid,
        name,
        email: auth.currentUser.email,
        phone: auth.currentUser.phoneNumber || "",
        instagram: "",
        role: roleFor(auth.currentUser.uid),
      };
      await seedOwnerListings(profile).catch((error) => {
        console.error("Could not seed listings", error);
      });
    }
  }, []);

  const updateAccountProfile = useCallback(async (updates: ProfileUpdates) => {
    if (!auth?.currentUser || !db) {
      throw new Error("Sign in again to update your profile.");
    }

    const name = updates.name.trim();
    if (name.length < 2) throw new Error("Enter your name or shop name.");

    let phone = updates.phone.trim();
    if (phone) {
      phone = toE164Phone(phone);
    }

    const email = updates.email.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("That email does not look right.");
    }

    const instagram = normalizeInstagram(updates.instagram);

    await updateProfile(auth.currentUser, { displayName: name });

    await setDoc(
      doc(db, "users", auth.currentUser.uid),
      {
        name,
        phone,
        email: email || null,
        instagram: instagram || null,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    setUser((current) =>
      current
        ? {
            ...current,
            name,
            phone,
            email: email || null,
            instagram,
          }
        : null,
    );
    setNeedsName(false);
  }, []);

  const signOut = useCallback(async () => {
    clearPhoneSignIn();
    if (auth) await firebaseSignOut(auth);
    setUser(null);
    setNeedsName(false);
  }, [clearPhoneSignIn]);

  const value = useMemo(
    () => ({
      user,
      loading,
      firebaseReady: isFirebaseConfigured,
      needsName,
      signInEmail,
      signUpEmail,
      signInGoogle,
      startPhoneSignIn,
      confirmPhoneCode,
      completeProfileName,
      updateAccountProfile,
      clearPhoneSignIn,
      signOut,
    }),
    [
      user,
      loading,
      needsName,
      signInEmail,
      signUpEmail,
      signInGoogle,
      startPhoneSignIn,
      confirmPhoneCode,
      completeProfileName,
      updateAccountProfile,
      clearPhoneSignIn,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
