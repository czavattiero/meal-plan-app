'use client'
import { useEffect, useState } from 'react'
import { NotificationRule } from '@/types'
import { getSavedRules } from '@/lib/notifications'

const PUSH_SUBSCRIBED_KEY = 'meal-plan-push-subscribed'
const DEVICE_ID_KEY = 'meal-plan-device-id'

export type PushSupportState = {
  canSubscribe: boolean
  reason: 'supported' | 'requires-install' | 'unsupported'
  message?: string
}

export function getStoredDeviceId(): string | null {
  return localStorage.getItem(DEVICE_ID_KEY)
}

function getOrCreateDeviceId(): string {
  let id = getStoredDeviceId()
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(DEVICE_ID_KEY, id)
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

function parseIOSVersion(userAgent: string): { major: number; minor: number } | null {
  const match = userAgent.match(/OS (\d+)[._](\d+)/)
  if (!match) return null

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
  }
}

function isAppleMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false

  return (
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

function isStandaloneMode(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  )
}

export function getPushSupportState(): PushSupportState {
  if (
    typeof window === 'undefined' ||
    typeof navigator === 'undefined'
  ) {
    return { canSubscribe: false, reason: 'unsupported' }
  }

  if (isAppleMobileDevice()) {
    const iosVersion = parseIOSVersion(navigator.userAgent)

    if (
      iosVersion &&
      (iosVersion.major < 16 ||
        (iosVersion.major === 16 && iosVersion.minor < 4))
    ) {
      return {
        canSubscribe: false,
        reason: 'unsupported',
        message:
          'This iPhone cannot receive web push reminders. Apple only supports them on iOS 16.4+ devices, so older models such as iPhone 6 are not supported.',
      }
    }

    if (!isStandaloneMode()) {
      return {
        canSubscribe: false,
        reason: 'requires-install',
        message:
          'On iPhone, closed-app reminders only work after Add to Home Screen. Reopen the app from your home screen, then allow notifications there.',
      }
    }
  }

  if (
    !('serviceWorker' in navigator) ||
    !('PushManager' in window) ||
    typeof Notification === 'undefined'
  ) {
    return {
      canSubscribe: false,
      reason: 'unsupported',
      message:
        'This device does not support web push reminders for this app. Meal reminders will only appear while the app is open.',
    }
  }

  return { canSubscribe: true, reason: 'supported' }
}

export async function subscribeToPush(): Promise<boolean> {
  const support = getPushSupportState()
  if (!support.canSubscribe) {
    clearPushSubscriptionFlag()
    return false
  }

  if (localStorage.getItem(PUSH_SUBSCRIBED_KEY) === 'true') {
    const reg = await navigator.serviceWorker.ready
    const existing = await reg.pushManager.getSubscription()
    if (existing) return true
    clearPushSubscriptionFlag()
  }

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
      body: JSON.stringify({
        subscription,
        deviceId,
        rules: getSavedRules(),
      }),
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

export async function syncNotificationRules(
  rules: NotificationRule[]
): Promise<boolean> {
  if (localStorage.getItem(PUSH_SUBSCRIBED_KEY) !== 'true') return false

  const deviceId = getStoredDeviceId()
  if (!deviceId) return false

  try {
    const response = await fetch('/api/push/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, rules }),
    })

    return response.ok
  } catch (error) {
    console.error('Notification rule sync failed:', error)
    return false
  }
}

export function usePushSubscription() {
  const [support] = useState<PushSupportState>(() => getPushSupportState())

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
      clearPushSubscriptionFlag()
    }

    if (support.canSubscribe) {
      void subscribeToPush()
    }
  }, [support])

  return support
}
