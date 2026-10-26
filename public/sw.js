self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = {
    title: "Vendors Gram",
    body: "",
    href: "/",
    icon: "/icon-192.png",
  };
  try {
    payload = { ...payload, ...event.data.json() };
  } catch {
    payload.body = event.data.text();
  }

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      // Skip the system banner only when the app is open and visible —
      // in-app notifications cover that case. Background / installed PWA still alerts.
      const visible = windows.some(
        (client) => client.visibilityState === "visible" && client.focused,
      );
      if (visible) return;

      await self.registration.showNotification(payload.title || "Vendors Gram", {
        body: payload.body || "",
        icon: payload.icon || "/icon-192.png",
        badge: "/badge-96.png",
        data: { href: payload.href || "/" },
        renotify: true,
        tag: payload.href || "vendorsgram",
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path = event.notification.data?.href || "/";
  const url = new URL(path, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          client.postMessage({ type: "navigate", href: path });
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
