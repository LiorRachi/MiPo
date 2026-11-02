// Minimal service worker: exists only to receive Web Push events and show
// a notification for them, plus install itself (PWA installability also
// needs a registered service worker, not just a manifest). No caching/offline
// strategy — that's a separate concern this app doesn't need yet.

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    // A malformed payload shouldn't crash the handler — fall back to {}.
  }
  const title = data.title || "MiPo";
  const options = {
    body: data.body || "",
    // Android's notification tray needs raster icons — an SVG here silently
    // renders as a blank/default icon on Chrome for Android. icon-192 is
    // the full-color app icon shown in the notification body; badge-96 is
    // a white-on-transparent silhouette (Android recolors it itself for
    // the status-bar icon, so it must not carry any real color/background).
    icon: "/icon-192.png",
    badge: "/badge-96.png",
    data: { url: data.url || "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});
