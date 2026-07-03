self.addEventListener('push', function (event) {
  if (!event.data) return

  const data = event.data.json()
  const title = data.title || 'Meal Plan'
  let resolvedUrl = self.location.origin

  if (data.url) {
    try {
      resolvedUrl = new URL(data.url, self.location.origin).toString()
    } catch {
      resolvedUrl = self.location.origin
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    data: { url: resolvedUrl },
    requireInteraction: true,
    actions: data.url
      ? [{ action: 'open-link', title: 'Open link' }]
      : [],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  const url = event.notification.data?.url || self.location.origin

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus()
      }

      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
