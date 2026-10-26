import { publicEnv } from "@/lib/env";

/** True when this window is already running as the installed PWA. */
export function isStandalonePwa() {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  if (nav.standalone) return true;

  const modes = [
    "standalone",
    "fullscreen",
    "minimal-ui",
    "window-controls-overlay",
  ];
  for (const mode of modes) {
    if (window.matchMedia(`(display-mode: ${mode})`).matches) return true;
  }

  return false;
}

export function isIosDevice() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export const PUSH_PROMPT_STORAGE_KEY = "vg-push-prompt";
export const PUSH_DISMISSED_STORAGE_KEY = "vg-push-dismissed";

/** ISO timestamp of last install-popup show/dismiss — used for once-a-day cadence. */
export const INSTALL_PROMPT_AT_KEY = "vg-install-prompt-at";
/** User chose “Don’t show again”. */
export const INSTALL_PROMPT_NEVER_KEY = "vg-install-prompt-never";
/** Set when we know the PWA is installed (appinstalled / related apps API). */
export const INSTALL_INSTALLED_KEY = "vg-app-installed";

const DAY_MS = 24 * 60 * 60 * 1000;

export function markAppInstalled() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(INSTALL_INSTALLED_KEY, "1");
  window.localStorage.setItem(INSTALL_PROMPT_NEVER_KEY, "1");
}

export function markInstallPromptNever() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(INSTALL_PROMPT_NEVER_KEY, "1");
  window.localStorage.setItem(INSTALL_PROMPT_AT_KEY, new Date().toISOString());
}

/**
 * Detect installed PWA even when the user is browsing in a normal tab
 * (Chrome “Open in app” case). Clears localStorage shouldn't bring the prompt back.
 */
export async function isPwaInstalled(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (isStandalonePwa()) return true;
  if (window.localStorage.getItem(INSTALL_INSTALLED_KEY) === "1") return true;

  const nav = window.navigator as Navigator & {
    getInstalledRelatedApps?: () => Promise<Array<{ platform?: string; url?: string }>>;
  };
  if (typeof nav.getInstalledRelatedApps === "function") {
    try {
      const apps = await nav.getInstalledRelatedApps();
      if (apps?.some((app) => app.platform === "webapp" || Boolean(app.url))) {
        markAppInstalled();
        return true;
      }
    } catch {
      // Unsupported / blocked — fall through.
    }
  }

  return false;
}

export function shouldShowInstallPromptToday() {
  if (typeof window === "undefined") return false;
  if (isStandalonePwa()) return false;
  if (window.localStorage.getItem(INSTALL_PROMPT_NEVER_KEY) === "1") return false;
  if (window.localStorage.getItem(INSTALL_INSTALLED_KEY) === "1") return false;

  const raw = window.localStorage.getItem(INSTALL_PROMPT_AT_KEY);
  if (!raw) return true;
  const at = Date.parse(raw);
  if (Number.isNaN(at)) return true;
  return Date.now() - at >= DAY_MS;
}

export function markInstallPromptSeen() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(INSTALL_PROMPT_AT_KEY, new Date().toISOString());
}

export function manifestUrl() {
  const origin = (publicEnv.appUrl || "https://vendorsgram.com").replace(/\/$/, "");
  return `${origin}/manifest.webmanifest`;
}
