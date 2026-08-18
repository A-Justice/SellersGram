"use client";

import { useEffect, useState } from "react";

type BeforeInstall = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallAppCard() {
  const [standalone, setStandalone] = useState(true);
  const [ios, setIos] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstall | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");
    const nav = window.navigator as Navigator & { standalone?: boolean };
    setStandalone(media.matches || Boolean(nav.standalone));
    setIos(/iPad|iPhone|iPod/.test(navigator.userAgent));

    function onPrompt(event: Event) {
      event.preventDefault();
      setInstallEvent(event as BeforeInstall);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (standalone) return null;

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  }

  return (
    <div className="rounded-[28px] bg-paper p-6 shadow-[0_0_0_1px_var(--color-line)]">
      <h2 className="font-display text-2xl tracking-tight">Install the app</h2>
      <p className="mt-2 text-sm text-muted">
        Add Sellers Gram to your home screen for a faster, full-screen experience
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
