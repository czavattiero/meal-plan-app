import { NextResponse } from 'next/server'
import {
  formatSlotKey,
  getDueRulesForScheduleParts,
  getMostRecentHalfHourScheduleParts,
  getNotificationScheduleParts,
  getPrevHalfHourScheduleParts,
  mergeRulePreferences,
} from '@/lib/notifications'
import { sendPush } from '@/lib/sendPush'
import { createServerClient } from '@/lib/supabase'
import {
  isMissingLastNotifiedSlotColumnError,
  isMissingNotificationRulesColumnError,
} from '@/lib/pushSubscriptionSchema'

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
  const currentSlot = getMostRecentHalfHourScheduleParts(now)
  const prevSlot = getPrevHalfHourScheduleParts(now)
  const currentSlotKey = formatSlotKey(currentSlot)
  const prevSlotKey = formatSlotKey(prevSlot)
  const { hour, minute, dayOfWeek } = currentSlot

  const db = createServerClient()

  // Fetch subscriptions with both optional columns; fall back if either is missing
  let { data: subscriptions, error } = await db
    .from('push_subscriptions')
    .select('device_id, notification_rules, last_notified_slot')

  if (error && isMissingLastNotifiedSlotColumnError(error)) {
    ;({ data: subscriptions, error } = await db
      .from('push_subscriptions')
      .select('device_id, notification_rules'))
  }

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

  // For each subscription determine which slots (previous and/or current) have
  // not yet been processed, to recover from late or skipped GitHub Actions runs.
  const dueNotifications = (subscriptions ?? []).flatMap(subscription => {
    const rules = mergeRulePreferences(subscription.notification_rules)
    const lastFired: string = subscription.last_notified_slot ?? ''

    const slotsToCheck = []
    if (prevSlotKey > lastFired) slotsToCheck.push(prevSlot)
    if (currentSlotKey > lastFired) slotsToCheck.push(currentSlot)

    return slotsToCheck.flatMap(slot =>
      getDueRulesForScheduleParts(rules, slot).map(rule => ({
        deviceId: subscription.device_id,
        rule,
      }))
    )
  })

  // Send all due notifications
  const results = dueNotifications.length > 0
    ? await Promise.allSettled(
        dueNotifications.map(({ deviceId, rule }) =>
          sendPush({
            title: rule.title,
            body: rule.body,
            icon: rule.icon,
            deviceId,
          })
        )
      )
    : []

  const sent = results.reduce((count, result) => {
    if (result.status !== 'fulfilled') return count
    return count + result.value.sent
  }, 0)
  const failed = results.reduce((count, result) => {
    if (result.status === 'fulfilled') return count + result.value.failed
    return count + 1
  }, 0)

  // Advance the deduplication cursor for all subscriptions so future runs
  // do not re-fire slots that were already handled.
  const deviceIds = (subscriptions ?? []).map(s => s.device_id)
  if (deviceIds.length > 0) {
    await db
      .from('push_subscriptions')
      .update({ last_notified_slot: currentSlotKey })
      .in('device_id', deviceIds)
  }

  return NextResponse.json({
    sent,
    failed,
    total: dueNotifications.length,
    hour,
    minute,
    dayOfWeek,
    currentHour,
    currentMinute,
    currentSlotKey,
    prevSlotKey,
  })
}

