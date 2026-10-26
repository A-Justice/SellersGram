"use client";

import { useEffect, useState } from "react";
import { markAppInstalled } from "@/lib/pwa";

export type BeforeInstall = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferred: BeforeInstall | null = null;
const listeners = new Set<(event: BeforeInstall | null) => void>();
let capturing = false;

function notify(event: BeforeInstall | null) {
  deferred = event;
  for (const listener of listeners) listener(event);
}

/** Capture beforeinstallprompt once app-wide (shared by install card + popup). */
export function initInstallPromptCapture() {
  if (typeof window === "undefined" || capturing) return;
  capturing = true;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    notify(event as BeforeInstall);
  });

  window.addEventListener("appinstalled", () => {
    markAppInstalled();
    notify(null);
  });
}

export function getDeferredInstallPrompt() {
  return deferred;
}

export function useDeferredInstallPrompt() {
  const [event, setEvent] = useState<BeforeInstall | null>(null);

  useEffect(() => {
    initInstallPromptCapture();
    setEvent(deferred);
    const onChange = (next: BeforeInstall | null) => setEvent(next);
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, []);

  return event;
}
