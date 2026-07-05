self.addEventListener('push', function (event) {
  if (!event.data) return

  const data = event.data.json()
  const title = typeof data.title === 'string' ? data.title.trim() : ''
  const resolveAssetUrl = function (value) {
    if (typeof value !== 'string' || !value.trim()) return undefined
    try {
      const parsed = new URL(value, self.location.origin)
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed.toString()
      }
    } catch {}
    return undefined
  }

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

  const subjectLine = title || 'Meal plan'
  const notificationBody = typeof data.body === 'string' ? data.body.trim() : ''
  const bodyLines = [notificationBody]

  if (displayUrl && !notificationBody.includes(displayUrl)) {
    bodyLines.push(displayUrl)
  }

  const body = bodyLines.filter(Boolean).join('\n')

  const icon = resolveAssetUrl(data.icon) || '/icon-192.png'
  const image = resolveAssetUrl(data.image)

  const options = {
    body,
    icon,
    ...(image ? { image } : {}),
    data: { url: resolvedUrl },
    requireInteraction: true,
    actions: displayUrl
      ? [{ action: 'open-link', title: 'Open link' }]
      : [],
  }

  event.waitUntil(self.registration.showNotification(subjectLine, options))
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
