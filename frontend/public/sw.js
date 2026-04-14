// TradeMind Service Worker — Web Push handler

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

// ── Push received ────────────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  let payload = { title: "TradeMind", body: "", icon: "/logo.jpg", url: "/app" };

  try {
    if (event.data) Object.assign(payload, event.data.json());
  } catch (_) {}

  const { title, body, icon, url, tag, badge } = payload;

  event.waitUntil(
    self.registration.showNotification(title, {
      body:    body    || "",
      icon:    icon    || "/logo.jpg",
      badge:   badge   || "/logo.jpg",
      tag:     tag     || "trademind",
      data:    { url:  url || "/app" },
      vibrate: [80, 40, 80],
      requireInteraction: false,
    })
  );
});

// ── Notification click → open/focus the app ───────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url ?? "/app";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // If app is already open — focus it and navigate
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus();
            client.navigate(target);
            return;
          }
        }
        // Otherwise open a new window
        if (self.clients.openWindow) return self.clients.openWindow(target);
      })
  );
});
