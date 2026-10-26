/** Navigate to a notification destination, including hash targets like #comments. */
export function goToNotificationHref(
  router: { push: (href: string) => void },
  href: string | null | undefined,
) {
  const raw = (href || "/").trim() || "/";
  const hashIndex = raw.indexOf("#");
  const path = hashIndex >= 0 ? raw.slice(0, hashIndex) || "/" : raw;
  const hash = hashIndex >= 0 ? raw.slice(hashIndex + 1) : "";

  router.push(path);

  if (!hash || typeof document === "undefined") return;

  const scroll = () => {
    const el = document.getElementById(hash);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      return true;
    }
    return false;
  };

  // Listing pages load data client-side; retry briefly until the anchor exists.
  if (scroll()) return;
  let tries = 0;
  const timer = window.setInterval(() => {
    tries += 1;
    if (scroll() || tries >= 20) window.clearInterval(timer);
  }, 100);
}
