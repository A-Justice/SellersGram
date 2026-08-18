"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { authErrorMessage } from "@/lib/auth-errors";

function LoginForm() {
  const { signInEmail, signUpEmail, signInGoogle, firebaseReady } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      if (mode === "up") await signUpEmail(name, email, password);
      else await signInEmail(email, password);
      router.push(next);
    } catch (err) {
      setError(authErrorMessage(err));
    }
  }

  return (
    <div className="mx-auto max-w-md py-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
        Account
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">
        {mode === "in" ? "Welcome back" : "Create account"}
      </h1>
      <p className="mt-2 text-sm text-muted">
        Browse without an account. Sign in to chat and sell.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-8 space-y-3 rounded-[28px] bg-paper p-6 shadow-[0_0_0_1px_var(--color-line)]"
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
          disabled={!firebaseReady}
          className="h-12 w-full rounded-full bg-ink text-paper disabled:opacity-40"
        >
          {mode === "in" ? "Sign in" : "Create account"}
        </button>
        <button
          type="button"
          disabled={!firebaseReady}
          onClick={async () => {
            try {
              await signInGoogle();
              router.push(next);
            } catch (err) {
              setError(authErrorMessage(err));
            }
          }}
          className="h-12 w-full rounded-full bg-canvas"
        >
          Continue with Google
        </button>
        {!firebaseReady && (
          <p className="text-xs text-muted">
            Firebase is not connected. Add keys to `.env.local` and restart.
          </p>
        )}
      </form>

      <button
        type="button"
        onClick={() => setMode(mode === "in" ? "up" : "in")}
        className="mt-6 w-full text-sm text-muted"
      >
        {mode === "in" ? "Need an account? Create one" : "Have an account? Sign in"}
      </button>
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
