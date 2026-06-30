import { NextResponse } from 'next/server'
import { getRedis } from '@/lib/redis'

export async function POST(request: Request) {
  try {
    const kv = getRedis()

    if (!kv) {
      return NextResponse.json(
        { error: 'Push subscriptions are not configured' },
        { status: 503 }
      )
    }

    const { subscription, deviceId } = await request.json()

    if (!subscription || !deviceId) {
      return NextResponse.json(
        { error: 'Missing subscription or deviceId' },
        { status: 400 }
      )
    }

    await kv.set(
      `push:${deviceId}`,
      JSON.stringify(subscription),
      { ex: 60 * 60 * 24 * 90 }
    )

    await kv.sadd('push:all-devices', deviceId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Subscribe error:', error)
    return NextResponse.json(
      { error: 'Failed to save subscription' },
      { status: 500 }
    )
  }
}