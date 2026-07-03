self.addEventListener('push', function (event) {
  if (!event.data) return

  const data = event.data.json()
  const title = data.title || 'Meal Plan'
  let resolvedUrl = self.location.origin
  let displayUrl = ''

  if (data.url) {
    try {
      const parsedUrl = new URL(data.url, self.location.origin)
      if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
        resolvedUrl = parsedUrl.toString()
        displayUrl = parsedUrl.toString()
      }
    } catch {
      resolvedUrl = self.location.origin
    }
  }

  const notificationBody = typeof data.body === 'string' ? data.body : ''
  const body =
    displayUrl && !notificationBody.includes(displayUrl)
      ? [notificationBody, displayUrl].filter(Boolean).join('\n')
      : notificationBody

  const options = {
    body,
    icon: data.icon || '/icon-192.png',
    data: { url: resolvedUrl },
    requireInteraction: true,
    actions: displayUrl
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
