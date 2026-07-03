import { NextResponse } from 'next/server'
import { sendPush } from '@/lib/sendPush'

export async function POST(request: Request) {
  try {
    if (process.env.CRON_SECRET) {
      const authHeader = request.headers.get('authorization')
      if (authHeader !== 'Bearer ' + process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const { title, body, icon, image, url, videoUrl, deviceId } = await request.json()

    if (!title || !body) {
      return NextResponse.json(
        { error: 'title and body are required' },
        { status: 400 }
      )
    }

    const result = await sendPush({ title, body, icon, image, url, videoUrl, deviceId })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Send notification error:', error)
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    )
  }
}
