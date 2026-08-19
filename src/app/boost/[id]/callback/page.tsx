"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import { bumpData } from "@/lib/use-listings";

function BoostCallback() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get("reference") || searchParams.get("trxref") || "";
  const [state, setState] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("Confirming your payment…");

  useEffect(() => {
    if (!reference) {
      setState("error");
      setMessage("Missing payment reference.");
      return;
    }

    let cancelled = false;

    async function verify() {
      try {
        const token = await auth?.currentUser?.getIdToken();
        if (!token) throw new Error("Sign in again to finish boosting your ad.");

        const response = await fetch("/api/paystack/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reference }),
        });
        const data = (await response.json()) as { error?: string; success?: boolean };
        if (!response.ok) throw new Error(data.error || "Payment verification failed.");

        if (cancelled) return;
        bumpData();
        setState("success");
        setMessage("Your ad is now a Top Ad.");
        window.setTimeout(() => router.replace("/my-ads"), 1800);
      } catch (error) {
        if (cancelled) return;
        setState("error");
        setMessage(error instanceof Error ? error.message : "Payment verification failed.");
      }
    }

    void verify();
    return () => {
      cancelled = true;
    };
  }, [reference, router]);

  return (
    <div className="mx-auto max-w-lg space-y-4 py-16 text-center">
      <h1 className="font-display text-3xl tracking-tight">
        {state === "success" ? "Boost active" : state === "error" ? "Boost failed" : "Almost there"}
      </h1>
      <p className="text-sm text-muted">{message}</p>
      {state === "error" ? (
        <div className="flex justify-center gap-4 pt-2 text-sm">
          <Link href={`/boost/${params.id}`} className="font-medium text-accent">
            Try again
          </Link>
          <Link href="/my-ads" className="text-muted">
            My ads
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export default function BoostCallbackPage() {
  return (
    <Suspense fallback={<p className="py-16 text-center text-muted">Confirming payment…</p>}>
      <BoostCallback />
    </Suspense>
  );
}
