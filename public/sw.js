self.addEventListener('push', function (event) {
  if (!event.data) return

  const data = event.data.json()
  const title = data.title || 'Meal Plan'
  const url = data.url || '/'
  const resolvedUrl = new URL(url, self.location.origin).toString()
  const body = data.url ? `${data.body}\n${resolvedUrl}` : data.body
  const options = {
    body,
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
    clients.matchAll({ type: 'window' }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus()
      }

      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
