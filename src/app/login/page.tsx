"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { authErrorMessage } from "@/lib/auth-errors";
import { formatPhoneDisplay } from "@/lib/phone";

type Method = "email" | "phone";
type PhoneStep = "number" | "code" | "name";

function LoginForm() {
  const {
    signInEmail,
    signUpEmail,
    signInGoogle,
    startPhoneSignIn,
    confirmPhoneCode,
    completeProfileName,
    clearPhoneSignIn,
    firebaseReady,
    needsName,
    user,
    loading,
  } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";

  const [method, setMethod] = useState<Method>("email");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [phoneStep, setPhoneStep] = useState<PhoneStep>("number");
  const [sentTo, setSentTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user && needsName) {
      setMethod("phone");
      setPhoneStep("name");
    }
  }, [loading, user, needsName]);

  function switchMethod(nextMethod: Method) {
    setError("");
    setMethod(nextMethod);
    if (nextMethod !== "phone") {
      clearPhoneSignIn();
      setPhoneStep("number");
      setCode("");
      setSentTo("");
      setName("");
    }
  }

  async function onEmailSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "up") await signUpEmail(name, email, password);
      else await signInEmail(email, password);
      router.push(next);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onSendCode(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const e164 = await startPhoneSignIn(phone);
      setSentTo(e164);
      setPhoneStep("code");
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onConfirmCode(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = await confirmPhoneCode(code);
      if (result.needsName) {
        setName("");
        setPhoneStep("name");
        return;
      }
      router.push(next);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onSaveName(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await completeProfileName(name);
      router.push(next);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const heading =
    method === "phone"
      ? phoneStep === "code"
        ? "Enter code"
        : phoneStep === "name"
          ? "Almost done"
          : "Sign in with phone"
      : mode === "in"
        ? "Welcome back"
        : "Create account";

  const subtitle =
    method === "phone" && phoneStep === "code"
      ? `We sent a 6-digit code to ${formatPhoneDisplay(sentTo) || sentTo}.`
      : method === "phone" && phoneStep === "name"
        ? "Tell buyers what to call you — your name or your shop name."
        : "Browse without an account. Sign in to chat and sell.";

  return (
    <div className="mx-auto max-w-md py-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
        Account
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">{heading}</h1>
      <p className="mt-2 text-sm text-muted">{subtitle}</p>

      {phoneStep !== "name" ? (
        <div className="mt-6 grid grid-cols-2 gap-1 rounded-full bg-paper p-1 shadow-[0_0_0_1px_var(--color-line)]">
          <button
            type="button"
            onClick={() => switchMethod("email")}
            className={`h-10 rounded-full text-sm font-medium transition ${
              method === "email" ? "bg-ink text-paper" : "text-muted"
            }`}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => switchMethod("phone")}
            className={`h-10 rounded-full text-sm font-medium transition ${
              method === "phone" ? "bg-ink text-paper" : "text-muted"
            }`}
          >
            Phone
          </button>
        </div>
      ) : null}

      {method === "email" ? (
        <form
          onSubmit={onEmailSubmit}
          className="mt-6 space-y-3 rounded-[28px] bg-paper p-6 shadow-[0_0_0_1px_var(--color-line)]"
        >
          {mode === "up" && (
            <input
              className="field"
              placeholder="Your name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          )}
          <input
            className="field"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required={firebaseReady}
          />
          <input
            className="field"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required={firebaseReady}
          />
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={!firebaseReady || busy}
            className="h-12 w-full rounded-full bg-ink text-paper disabled:opacity-40"
          >
            {mode === "in" ? "Sign in" : "Create account"}
          </button>
          <button
            type="button"
            disabled={!firebaseReady || busy}
            onClick={async () => {
              setError("");
              setBusy(true);
              try {
                await signInGoogle();
                router.push(next);
              } catch (err) {
                setError(authErrorMessage(err));
              } finally {
                setBusy(false);
              }
            }}
            className="h-12 w-full rounded-full bg-canvas disabled:opacity-40"
          >
            Continue with Google
          </button>
          {!firebaseReady && (
            <p className="text-xs text-muted">
              Firebase is not connected. Add keys to `.env.local` and restart.
            </p>
          )}
        </form>
      ) : phoneStep === "number" ? (
        <form
          onSubmit={onSendCode}
          className="mt-6 space-y-3 rounded-[28px] bg-paper p-6 shadow-[0_0_0_1px_var(--color-line)]"
        >
          <input
            className="field"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="0244123456 or +233244123456"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            required
          />
          <p className="text-xs text-muted">
            Ghana numbers work with or without +233. We’ll text you a code.
          </p>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={!firebaseReady || busy}
            className="h-12 w-full rounded-full bg-ink text-paper disabled:opacity-40"
          >
            {busy ? "Sending…" : "Send code"}
          </button>
          {!firebaseReady && (
            <p className="text-xs text-muted">
              Firebase is not connected. Add keys to `.env.local` and restart.
            </p>
          )}
        </form>
      ) : phoneStep === "code" ? (
        <form
          onSubmit={onConfirmCode}
          className="mt-6 space-y-3 rounded-[28px] bg-paper p-6 shadow-[0_0_0_1px_var(--color-line)]"
        >
          <input
            className="field"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="6-digit code"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            required
          />
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={!firebaseReady || busy || code.length !== 6}
            className="h-12 w-full rounded-full bg-ink text-paper disabled:opacity-40"
          >
            {busy ? "Verifying…" : "Verify & sign in"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              clearPhoneSignIn();
              setPhoneStep("number");
              setCode("");
              setError("");
            }}
            className="h-12 w-full rounded-full bg-canvas disabled:opacity-40"
          >
            Use a different number
          </button>
        </form>
      ) : (
        <form
          onSubmit={onSaveName}
          className="mt-6 space-y-3 rounded-[28px] bg-paper p-6 shadow-[0_0_0_1px_var(--color-line)]"
        >
          <input
            className="field"
            autoComplete="name"
            placeholder="Your name or shop name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            minLength={2}
            autoFocus
          />
          <p className="text-xs text-muted">
            Buyers will see this on your ads and when they chat with you.
          </p>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={!firebaseReady || busy || name.trim().length < 2}
            className="h-12 w-full rounded-full bg-ink text-paper disabled:opacity-40"
          >
            {busy ? "Saving…" : "Continue"}
          </button>
        </form>
      )}

      {/* Invisible reCAPTCHA mount point for Firebase phone auth */}
      <div id="phone-recaptcha" />

      {method === "email" && (
        <button
          type="button"
          onClick={() => setMode(mode === "in" ? "up" : "in")}
          className="mt-6 w-full text-sm text-muted"
        >
          {mode === "in" ? "Need an account? Create one" : "Have an account? Sign in"}
        </button>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
