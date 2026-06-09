import { Redis } from '@upstash/redis'
import webpush from 'web-push'
import { NextResponse } from 'next/server'

// Initialize Redis client
const kv = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

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

    const deviceIds = await kv.smembers('push:all-devices') as string[]

    if (deviceIds.length === 0) {
      return NextResponse.json({ sent: 0, total: 0, message: 'No subscribers yet' })
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: icon ?? '/icon-192.png',
      url: url ?? '/',
    })

    const results = await Promise.allSettled(
      deviceIds.map(async (deviceId) => {
        const subStr = await kv.get(`push:${deviceId}`) as string | null
        if (!subStr) {
          await kv.srem('push:all-devices', deviceId)
          throw new Error(`No subscription found for device ${deviceId}`)
        }
        const subscription = JSON.parse(subStr)
        await webpush.sendNotification(subscription, payload)
      })
    )

    const sent = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return NextResponse.json({ sent, failed, total: deviceIds.length })
  } catch (error) {
    console.error('Send notification error:', error)
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    )
  }
}
