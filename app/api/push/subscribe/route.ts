import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { extractRulePreferences } from '@/lib/notifications'

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

    const { error } = await db
      .from('push_subscriptions')
      .upsert(
        {
          device_id: deviceId,
          subscription,
          notification_rules: Array.isArray(rules)
            ? extractRulePreferences(rules)
            : null,
          updated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        },
        { onConflict: 'device_id' }
      )

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