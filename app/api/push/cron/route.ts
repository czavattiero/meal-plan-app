import { NextResponse } from 'next/server'
import {
  getDueRulesForMostRecentHalfHour,
  getMostRecentHalfHourScheduleParts,
  getNotificationScheduleParts,
  mergeRulePreferences,
} from '@/lib/notifications'
import { sendPush } from '@/lib/sendPush'
import { createServerClient } from '@/lib/supabase'
import { isMissingNotificationRulesColumnError } from '@/lib/pushSubscriptionSchema'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (
    process.env.CRON_SECRET &&
    authHeader !== 'Bearer ' + process.env.CRON_SECRET
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const { hour: currentHour, minute: currentMinute } =
    getNotificationScheduleParts(now)
  const { hour, minute, dayOfWeek } = getMostRecentHalfHourScheduleParts(now)
  const db = createServerClient()
  let { data: subscriptions, error } = await db
    .from('push_subscriptions')
    .select('device_id, notification_rules')

  if (error && isMissingNotificationRulesColumnError(error)) {
    ;({ data: subscriptions, error } = await db
      .from('push_subscriptions')
      .select('device_id'))
  }

  if (error) {
    console.error('Cron subscription fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to load subscriptions' },
      { status: 500 }
    )
  }

  const dueNotifications = (subscriptions ?? []).flatMap(subscription =>
    getDueRulesForMostRecentHalfHour(
      mergeRulePreferences(subscription.notification_rules),
      now
    ).map(rule => ({
      deviceId: subscription.device_id,
      rule,
    }))
  )

  if (dueNotifications.length === 0) {
    return NextResponse.json({
      sent: 0,
      total: 0,
      hour,
      minute,
      dayOfWeek,
      currentHour,
      currentMinute,
      message: 'No notifications due',
    })
  }

  const results = await Promise.allSettled(
    dueNotifications.map(({ deviceId, rule }) =>
      sendPush({
        title: rule.title,
        body: rule.body,
        icon: rule.icon,
        deviceId,
      })
    )
  )

  const sent = results.reduce((count, result) => {
    if (result.status !== 'fulfilled') return count
    return count + result.value.sent
  }, 0)
  const failed = results.reduce((count, result) => {
    if (result.status === 'fulfilled') return count + result.value.failed
    return count + 1
  }, 0)

  return NextResponse.json({
    sent,
    failed,
    total: dueNotifications.length,
    hour,
    minute,
    dayOfWeek,
    currentHour,
    currentMinute,
  })
}
