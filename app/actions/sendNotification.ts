'use server'
import { sendPush } from '@/lib/sendPush'

export interface SendNotificationResult {
  sent: number
  failed: number
  total: number
  message?: string
  error?: string
}

export async function sendCustomNotification(
  title: string,
  body: string,
  url?: string
): Promise<SendNotificationResult> {
  if (!title || !body) {
    return { sent: 0, failed: 0, total: 0, error: 'Title and body are required' }
  }

  try {
    const result = await sendPush({ title, body, url: url || '/' })
    return result
  } catch (err) {
    console.error('sendCustomNotification error:', err)
    return { sent: 0, failed: 0, total: 0, error: 'Failed to send notification' }
  }
}
