"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  currentPushSubscription,
  disableDevicePush,
  enableDevicePush,
  pushSupported,
} from "@/lib/push-client";

export function DeviceAlertsCard() {
  const { user } = useAuth();
  const [supported, setSupported] = useState(false);
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSupported(pushSupported());
    void currentPushSubscription().then((sub) => setOn(Boolean(sub)));
  }, []);

  if (!user) return null;

  const uid = user.uid;

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      if (on) {
        await disableDevicePush(uid);
        setOn(false);
      } else {
        await enableDevicePush(uid);
        setOn(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update alerts.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-[28px] bg-paper p-6 shadow-[0_0_0_1px_var(--color-line)]">
      <h2 className="font-display text-2xl tracking-tight">Device alerts</h2>
      <p className="mt-2 text-sm text-muted">
        {supported
          ? "Get a banner on your phone or computer when someone messages you or an ad is approved."
          : "This browser cannot show device alerts. Install the app or try Chrome on Android."}
      </p>
      {supported && (
        <button
          type="button"
          disabled={busy}
          onClick={() => void toggle()}
          className="mt-4 h-11 rounded-full bg-ink px-5 text-sm text-paper disabled:opacity-40"
        >
          {busy ? "Please wait…" : on ? "Turn off device alerts" : "Turn on device alerts"}
        </button>
      )}
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
