import { NextResponse } from 'next/server'
import { DEFAULT_RULES } from '@/lib/notifications'
import { sendPush } from '@/lib/sendPush'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (
    process.env.CRON_SECRET &&
    authHeader !== 'Bearer ' + process.env.CRON_SECRET
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const h = now.getUTCHours()
  const m = now.getUTCMinutes()
  const d = now.getUTCDay()

  const due = DEFAULT_RULES.filter(
    rule =>
      rule.enabled &&
      rule.daysOfWeek.includes(d) &&
      rule.triggerHour === h &&
      rule.triggerMinute === m
  )

  if (due.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No notifications due' })
  }

  const results = await Promise.allSettled(
    due.map(rule => sendPush({ title: rule.title, body: rule.body, icon: rule.icon }))
  )

  const succeeded = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  return NextResponse.json({ sent: succeeded, failed, total: due.length })
}
