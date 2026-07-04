import { NextResponse } from 'next/server'
import { sendPush } from '@/lib/sendPush'

export async function POST(request: Request) {
  try {
    const { title, body, icon, image, url, deviceId } = await request.json()

    if (!title || !body) {
      return NextResponse.json(
        { error: 'title and body are required' },
        { status: 400 }
      )
    }

    const result = await sendPush({ title, body, icon, image, url, deviceId })
    console.info('Send notification result:', result)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Send notification error:', error)
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    )
  }
}
