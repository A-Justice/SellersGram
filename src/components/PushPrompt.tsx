"use client";

import { Bell, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  currentPushSubscription,
  enableDevicePush,
  pushSupported,
  syncDevicePush,
} from "@/lib/push-client";
import {
  isStandalonePwa,
  PUSH_DISMISSED_STORAGE_KEY,
  PUSH_PROMPT_STORAGE_KEY,
} from "@/lib/pwa";

/**
 * When the PWA is installed (standalone), keep push subscribed and nudge
 * signed-in users who have not turned on device alerts yet.
 */
export function PushPrompt() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !pushSupported()) {
      setVisible(false);
      return;
    }

    let cancelled = false;

    async function boot() {
      const standalone = isStandalonePwa();
      const forcePrompt =
        typeof window !== "undefined" &&
        window.localStorage.getItem(PUSH_PROMPT_STORAGE_KEY) === "1";

      // Always re-sync when permission is already granted (installed or browser).
      if (Notification.permission === "granted") {
        await syncDevicePush(user!.uid).catch(() => undefined);
        if (!cancelled) setVisible(false);
        window.localStorage.removeItem(PUSH_PROMPT_STORAGE_KEY);
        return;
      }

      const existing = await currentPushSubscription();
      if (cancelled) return;
      if (existing) {
        setVisible(false);
        return;
      }

      const dismissed =
        window.localStorage.getItem(PUSH_DISMISSED_STORAGE_KEY) === "1";
      // Prompt in the installed app, or right after the user installs it.
      if ((standalone || forcePrompt) && !dismissed) {
        setVisible(true);
      }
    }

    void boot();

    function onInstalled() {
      window.localStorage.setItem(PUSH_PROMPT_STORAGE_KEY, "1");
      window.localStorage.removeItem(PUSH_DISMISSED_STORAGE_KEY);
      if (user) setVisible(true);
    }
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      cancelled = true;
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [user]);

  if (!visible || !user) return null;

  async function enable() {
    setBusy(true);
    setError(null);
    try {
      await enableDevicePush(user!.uid);
      window.localStorage.removeItem(PUSH_PROMPT_STORAGE_KEY);
      setVisible(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not enable device alerts.",
      );
    } finally {
      setBusy(false);
    }
  }

  function dismiss() {
    window.localStorage.setItem(PUSH_DISMISSED_STORAGE_KEY, "1");
    window.localStorage.removeItem(PUSH_PROMPT_STORAGE_KEY);
    setVisible(false);
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(max(5.5rem,env(safe-area-inset-bottom)+4.25rem))] z-40 flex justify-center px-4 md:bottom-6">
      <div className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-[24px] bg-ink p-4 text-paper shadow-[0_16px_40px_rgba(20,17,14,0.28)]">
        <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-accent text-paper">
          <Bell className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium leading-snug">Turn on device alerts</p>
          <p className="mt-1 text-sm text-paper/70">
            Get notified when someone messages you or comments on your ads —
            even when Vendors Gram is closed.
          </p>
          {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void enable()}
              className="inline-flex h-9 items-center rounded-full bg-paper px-4 text-sm font-medium text-ink disabled:opacity-50"
            >
              {busy ? "Enabling…" : "Enable alerts"}
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="inline-flex h-9 items-center rounded-full px-3 text-sm text-paper/70"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={dismiss}
          className="shrink-0 rounded-full p-1 text-paper/60 hover:text-paper"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
