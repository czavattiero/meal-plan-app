import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { extractRulePreferences } from '@/lib/notifications'
import {
  isMissingLastNotifiedSlotColumnError,
  isMissingNotificationRulesColumnError,
} from '@/lib/pushSubscriptionSchema'

export async function POST(request: Request) {
  try {
    const { subscription, deviceId, rules } = await request.json()

    if (!subscription || !deviceId) {
      return NextResponse.json(
        { error: 'Missing subscription or deviceId' },
        { status: 400 }
      )
    }

    const db = createServerClient()

    const subscriptionPayload = {
      device_id: deviceId,
      subscription,
      notification_rules: Array.isArray(rules)
        ? extractRulePreferences(rules)
        : null,
      last_notified_slot: null,
      updated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    }

    let { error } = await db
      .from('push_subscriptions')
      .upsert(subscriptionPayload, { onConflict: 'device_id' })

    if (error && isMissingLastNotifiedSlotColumnError(error)) {
      const withoutLastSlotPayload = {
        device_id: subscriptionPayload.device_id,
        subscription: subscriptionPayload.subscription,
        notification_rules: subscriptionPayload.notification_rules,
        updated_at: subscriptionPayload.updated_at,
        expires_at: subscriptionPayload.expires_at,
      }
      ;({ error } = await db
        .from('push_subscriptions')
        .upsert(withoutLastSlotPayload, { onConflict: 'device_id' }))
    }

    if (error && isMissingNotificationRulesColumnError(error)) {
      const legacyPayload = {
        device_id: subscriptionPayload.device_id,
        subscription: subscriptionPayload.subscription,
        updated_at: subscriptionPayload.updated_at,
        expires_at: subscriptionPayload.expires_at,
      }
      ;({ error } = await db
        .from('push_subscriptions')
        .upsert(legacyPayload, { onConflict: 'device_id' }))
    }

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Subscribe error:', error)
    return NextResponse.json(
      { error: 'Failed to save subscription' },
      { status: 500 }
    )
  }
}