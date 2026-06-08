'use client'
import { useEffect } from 'react'

const PUSH_SUBSCRIBED_KEY = 'meal-plan-push-subscribed'

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

function clearPushSubscriptionFlag() {
  localStorage.removeItem(PUSH_SUBSCRIBED_KEY)
}

export async function subscribeToPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false

  if (localStorage.getItem(PUSH_SUBSCRIBED_KEY) === 'true') return true

  if (Notification.permission !== 'granted') {
    clearPushSubscriptionFlag()
    return false
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

  if (!vapidPublicKey) {
    clearPushSubscriptionFlag()
    return false
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready

    const existingSubscription = await registration.pushManager.getSubscription()
    const subscription =
      existingSubscription ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      }))

    const deviceId = getOrCreateDeviceId()
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription, deviceId }),
    })

    if (!res.ok) {
      clearPushSubscriptionFlag()
      return false
    }

    localStorage.setItem(PUSH_SUBSCRIBED_KEY, 'true')
    return true
  } catch (err) {
    clearPushSubscriptionFlag()
    console.error('Push subscription failed:', err)
    return false
  }
}

export function usePushSubscription() {
  useEffect(() => {
    if (Notification.permission === 'denied') {
      clearPushSubscriptionFlag()
    }

    void subscribeToPush()
  }, [])
}
