import webpush from 'web-push'
import { createServerClient } from '@/lib/supabase'

let vapidInitialized = false

function initVapid() {
  if (vapidInitialized) return
  if (!process.env.VAPID_EMAIL || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    throw new Error('VAPID environment variables are not configured')
  }
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
  vapidInitialized = true
}

export interface PushPayload {
  title: string
  body: string
  icon?: string
  url?: string
  deviceId?: string
}

export interface PushResult {
  sent: number
  failed: number
  total: number
  message?: string
}

export async function sendPush(payload: PushPayload): Promise<PushResult> {
  initVapid()

  const db = createServerClient()

  let query = db.from('push_subscriptions').select('device_id, subscription')
  if (payload.deviceId) {
    query = query.eq('device_id', payload.deviceId)
  }

  const { data: rows, error: fetchError } = await query

  if (fetchError) throw fetchError

  if (!rows || rows.length === 0) {
    return { sent: 0, failed: 0, total: 0, message: 'No subscribers yet' }
  }

  const jsonPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon ?? '/icon-192.png',
    ...(payload.url && { url: payload.url }),
  })

  const results = await Promise.allSettled(
    rows.map(async ({ device_id, subscription }: { device_id: string; subscription: webpush.PushSubscription }) => {
      try {
        await webpush.sendNotification(subscription, jsonPayload)
      } catch (err) {
        await db.from('push_subscriptions').delete().eq('device_id', device_id)
        throw err
      }
    })
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  return { sent, failed, total: rows.length }
}
