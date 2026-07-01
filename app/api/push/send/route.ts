import webpush from 'web-push'
import { NextResponse } from 'next/server'
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

export async function POST(request: Request) {
  try {
    initVapid()

    const { title, body, icon, url } = await request.json()

    if (!title || !body) {
      return NextResponse.json(
        { error: 'title and body are required' },
        { status: 400 }
      )
    }

    const db = createServerClient()

    const { data: rows, error: fetchError } = await db
      .from('push_subscriptions')
      .select('device_id, subscription')

    if (fetchError) throw fetchError

    if (!rows || rows.length === 0) {
      return NextResponse.json({ sent: 0, total: 0, message: 'No subscribers yet' })
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: icon ?? '/icon-192.png',
      url: url ?? '/',
    })

    const results = await Promise.allSettled(
      rows.map(async ({ device_id, subscription }) => {
        try {
          await webpush.sendNotification(subscription, payload)
        } catch (err) {
          // Remove stale subscriptions (e.g. 410 Gone)
          await db.from('push_subscriptions').delete().eq('device_id', device_id)
          throw err
        }
      })
    )

    const sent = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return NextResponse.json({ sent, failed, total: rows.length })
  } catch (error) {
    console.error('Send notification error:', error)
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    )
  }
}
