'use client'
import { useEffect } from 'react'

function getOrCreateDeviceId(): string {
  let id = localStorage.getItem('meal-plan-device-id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('meal-plan-device-id', id)
  }
  return id
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray.buffer
}

export function usePushSubscription() {
  useEffect(() => {
    async function subscribe() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
      if (localStorage.getItem('meal-plan-push-subscribed') === 'true') return

      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return

      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        await navigator.serviceWorker.ready

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
          ),
        })

        const deviceId = getOrCreateDeviceId()
        const res = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription, deviceId }),
        })

        if (res.ok) {
          localStorage.setItem('meal-plan-push-subscribed', 'true')
        }
      } catch (err) {
        console.error('Push subscription failed:', err)
      }
    }

    subscribe()
  }, [])
}
