self.addEventListener("push", event => {
  let message = {};
  try {
    message = event.data ? event.data.json() : {};
  } catch {
    message = { title: "A letter has arrived 💌", body: "A little something is waiting in your mailbox.", url: "/mailbox" };
  }

  event.waitUntil(self.registration.showNotification(message.title || "A letter has arrived 💌", {
    body: message.body || "A little something is waiting in your mailbox.",
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-96.png",
    tag: message.tag || "dear-letter-arrival",
    renotify: false,
    data: { url: message.url || "/mailbox" },
  }));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/mailbox", self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      if (new URL(client.url).origin === self.location.origin) {
        await client.navigate(target);
        return client.focus();
      }
    }
    return self.clients.openWindow(target);
  })());
});
