import { NextResponse } from 'next/server'
import { extractRulePreferences } from '@/lib/notifications'
import { createServerClient } from '@/lib/supabase'
import { isMissingNotificationRulesColumnError } from '@/lib/pushSubscriptionSchema'

export async function POST(request: Request) {
  try {
    const { deviceId, rules } = await request.json()

    if (!deviceId || !Array.isArray(rules)) {
      return NextResponse.json(
        { error: 'Missing deviceId or rules' },
        { status: 400 }
      )
    }

    const db = createServerClient()

    let { data, error } = await db
      .from('push_subscriptions')
      .update({
        notification_rules: extractRulePreferences(rules),
        updated_at: new Date().toISOString(),
      })
      .eq('device_id', deviceId)
      .select('device_id')

    if (error && isMissingNotificationRulesColumnError(error)) {
      ;({ data, error } = await db
        .from('push_subscriptions')
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq('device_id', deviceId)
        .select('device_id'))
    }

    if (error) throw error

    return NextResponse.json({ success: true, synced: data.length > 0 })
  } catch (error) {
    console.error('Preference sync error:', error)
    return NextResponse.json(
      { error: 'Failed to save notification preferences' },
      { status: 500 }
    )
  }
}
