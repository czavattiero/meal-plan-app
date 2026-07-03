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
  attempts: PushAttemptResult[]
}

export interface PushAttemptResult {
  deviceId: string
  ok: boolean
  statusCode?: number
  error?: string
  deleted?: boolean
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
    return { sent: 0, failed: 0, total: 0, message: 'No subscribers yet', attempts: [] }
  }

  const jsonPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon ?? '/icon-192.png',
    ...(payload.url && { url: payload.url }),
  })

  const attempts = await Promise.all(
    rows.map(async ({ device_id, subscription }: { device_id: string; subscription: webpush.PushSubscription }) => {
      try {
        await webpush.sendNotification(subscription, jsonPayload)
        console.info('Push sent', { deviceId: device_id })
        return {
          deviceId: device_id,
          ok: true,
        } satisfies PushAttemptResult
      } catch (err) {
        // Only remove the subscription when the push service confirms it is
        // gone (410) or not found (404).  Transient errors (network issues,
        // rate limits, 5xx) must not delete a valid subscription.
        const statusCode = (err as { statusCode?: number }).statusCode
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown push send error'
        const deleted = statusCode === 410 || statusCode === 404
        if (statusCode === 410 || statusCode === 404) {
          await db.from('push_subscriptions').delete().eq('device_id', device_id)
        }
        console.error('Push failed', {
          deviceId: device_id,
          statusCode,
          error: errorMessage,
          deleted,
        })
        return {
          deviceId: device_id,
          ok: false,
          statusCode,
          error: errorMessage,
          deleted,
        } satisfies PushAttemptResult
      }
    })
  )

  const sent = attempts.filter(result => result.ok).length
  const failed = attempts.filter(result => !result.ok).length

  return { sent, failed, total: rows.length, attempts }
}
