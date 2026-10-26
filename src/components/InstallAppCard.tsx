"use client";

import { useEffect, useState } from "react";
import { useDeferredInstallPrompt } from "@/lib/install-prompt";
import {
  isIosDevice,
  isPwaInstalled,
  PUSH_DISMISSED_STORAGE_KEY,
  PUSH_PROMPT_STORAGE_KEY,
} from "@/lib/pwa";

export function InstallAppCard() {
  const installEvent = useDeferredInstallPrompt();
  const [installed, setInstalled] = useState(true);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    setIos(isIosDevice());
    let cancelled = false;
    void isPwaInstalled().then((value) => {
      if (!cancelled) setInstalled(value);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (installed) return null;

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") {
      window.localStorage.setItem(PUSH_PROMPT_STORAGE_KEY, "1");
      window.localStorage.removeItem(PUSH_DISMISSED_STORAGE_KEY);
    }
  }

  return (
    <div className="rounded-[28px] bg-paper p-6 shadow-[0_0_0_1px_var(--color-line)]">
      <h2 className="font-display text-2xl tracking-tight">Install the app</h2>
      <p className="mt-2 text-sm text-muted">
        Add Vendors Gram to your home screen for a faster, full-screen experience
        and device alerts.
      </p>
      {installEvent ? (
        <button
          type="button"
          onClick={() => void install()}
          className="mt-4 h-11 rounded-full bg-ink px-5 text-sm text-paper"
        >
          Add to home screen
        </button>
      ) : ios ? (
        <p className="mt-4 text-sm text-muted">
          On iPhone, tap Share, then Add to Home Screen.
        </p>
      ) : (
        <p className="mt-4 text-sm text-muted">
          Use your browser menu to install or add this site to your home screen.
        </p>
      )}
    </div>
  );
}
