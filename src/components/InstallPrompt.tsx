"use client";

import { Download, Share, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  getDeferredInstallPrompt,
  useDeferredInstallPrompt,
} from "@/lib/install-prompt";
import {
  isIosDevice,
  isPwaInstalled,
  isStandalonePwa,
  markAppInstalled,
  markInstallPromptNever,
  markInstallPromptSeen,
  PUSH_DISMISSED_STORAGE_KEY,
  PUSH_PROMPT_STORAGE_KEY,
  shouldShowInstallPromptToday,
} from "@/lib/pwa";

const SHOW_DELAY_MS = 2500;

/** Once-a-day popup encouraging install when the PWA is not on the home screen. */
export function InstallPrompt() {
  const installEvent = useDeferredInstallPrompt();
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      if (await isPwaInstalled()) {
        if (!cancelled) setVisible(false);
        return;
      }
      if (!shouldShowInstallPromptToday()) {
        if (!cancelled) setVisible(false);
        return;
      }

      setIos(isIosDevice());

      await new Promise((resolve) => window.setTimeout(resolve, SHOW_DELAY_MS));
      if (cancelled) return;

      if (await isPwaInstalled()) {
        setVisible(false);
        return;
      }
      if (!shouldShowInstallPromptToday()) {
        setVisible(false);
        return;
      }

      const iosDevice = isIosDevice();
      const deferred = getDeferredInstallPrompt();

      // Chromium: if the app is already installed, beforeinstallprompt never fires.
      // Don't show a useless “use your browser menu” sheet in that case.
      if (!deferred && !iosDevice) {
        setVisible(false);
        return;
      }

      setVisible(true);
      markInstallPromptSeen();
    }

    void boot();

    function onInstalled() {
      markAppInstalled();
      setVisible(false);
    }
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      cancelled = true;
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    if (isStandalonePwa()) {
      markAppInstalled();
      setVisible(false);
    }
  }, [visible, installEvent]);

  if (!visible) return null;

  function close() {
    markInstallPromptSeen();
    setVisible(false);
  }

  function neverShow() {
    markInstallPromptNever();
    setVisible(false);
  }

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    markInstallPromptSeen();
    setVisible(false);
    if (choice.outcome === "accepted") {
      markAppInstalled();
      window.localStorage.setItem(PUSH_PROMPT_STORAGE_KEY, "1");
      window.localStorage.removeItem(PUSH_DISMISSED_STORAGE_KEY);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/45 p-4 sm:items-center"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-prompt-title"
        className="w-full max-w-md rounded-[28px] bg-paper p-5 shadow-[0_24px_60px_rgba(20,17,14,0.28)] sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent">
            <Download className="size-5" />
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={close}
            className="rounded-full p-2 text-muted hover:bg-canvas hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </div>

        <h2
          id="install-prompt-title"
          className="mt-4 font-display text-2xl tracking-tight"
        >
          Install Vendors Gram
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Add it to your home screen for a faster full-screen experience and
          device alerts when someone messages you.
        </p>

        {installEvent ? (
          <button
            type="button"
            onClick={() => void install()}
            className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-full bg-ink text-sm font-medium text-paper hover:bg-accent"
          >
            Add to home screen
          </button>
        ) : ios ? (
          <div className="mt-5 rounded-2xl bg-canvas px-4 py-3 text-sm text-muted">
            <p className="flex items-start gap-2">
              <Share className="mt-0.5 size-4 shrink-0 text-accent" />
              <span>
                Tap <span className="font-medium text-ink">Share</span>, then{" "}
                <span className="font-medium text-ink">Add to Home Screen</span>.
              </span>
            </p>
          </div>
        ) : null}

        <button
          type="button"
          onClick={close}
          className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-full text-sm font-medium text-muted hover:bg-canvas hover:text-ink"
        >
          Not now
        </button>
        <button
          type="button"
          onClick={neverShow}
          className="mt-1 inline-flex h-10 w-full items-center justify-center rounded-full text-xs font-medium text-muted/80 hover:text-ink"
        >
          Don&apos;t show again
        </button>
      </div>
    </div>
  );
}
