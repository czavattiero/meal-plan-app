import webpush from 'web-push'
import { createServerClient } from '@/lib/supabase'

let vapidInitialized = false

// After this many consecutive push failures for a single device, the
// subscription is considered permanently broken and is deleted so the device
// re-subscribes on next app open.
const CONSECUTIVE_FAILURE_THRESHOLD = 5

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
  image?: string
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

function sanitizeHttpUrl(value: string | undefined): string | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString()
    }
  } catch {
    return undefined
  }

  return undefined
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

  const safeImage = sanitizeHttpUrl(payload.image)
  const safeUrl = sanitizeHttpUrl(payload.url)

  const jsonPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon ?? '/icon-192.png',
    ...(safeImage && { image: safeImage }),
    ...(safeUrl && { url: safeUrl }),
  })

  const attempts = await Promise.all(
    rows.map(async ({ device_id, subscription }: { device_id: string; subscription: webpush.PushSubscription }) => {
      try {
        await webpush.sendNotification(subscription, jsonPayload)
        console.info('Push sent', { deviceId: device_id })
        // Reset failure counter on success (best-effort; ignore if column missing)
        await db
          .from('push_subscriptions')
          .update({ consecutive_failures: 0 })
          .eq('device_id', device_id)
          .then(() => undefined, () => undefined)
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
        let deleted = statusCode === 410 || statusCode === 404
        if (statusCode === 410 || statusCode === 404) {
          await db.from('push_subscriptions').delete().eq('device_id', device_id)
        } else {
          // For all other failures (e.g. 400 expired token, network errors),
          // increment the consecutive failure counter and delete the
          // subscription once the threshold is exceeded.  This breaks the
          // loop where a permanently broken subscription is never cleaned up
          // because it never returns 404 / 410.
          const { data: sub } = await db
            .from('push_subscriptions')
            .select('consecutive_failures')
            .eq('device_id', device_id)
            .single()
            .then(r => r, () => ({ data: null }))
          const failures = ((sub as { consecutive_failures?: number } | null)?.consecutive_failures ?? 0) + 1
          if (failures >= CONSECUTIVE_FAILURE_THRESHOLD) {
            await db.from('push_subscriptions').delete().eq('device_id', device_id)
            deleted = true
          } else {
            await db
              .from('push_subscriptions')
              .update({ consecutive_failures: failures })
              .eq('device_id', device_id)
              .then(() => undefined, () => undefined)
          }
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
