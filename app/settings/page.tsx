'use client'
import { useNotifications } from '@/hooks/useNotifications'
import { FormEvent, useState } from 'react'

type PushAttemptResult = {
  deviceId: string
  ok: boolean
  statusCode?: number
  error?: string
  deleted?: boolean
}

type SendPayload = {
  error?: string
  sent?: number
  failed?: number
  total?: number
  attempts?: PushAttemptResult[]
}

export default function SettingsPage() {
  const { rules, toggleRule, updateTime } = useNotifications()
  const [title, setTitle] = useState('Test')
  const [body, setBody] = useState('Have fun!')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<{
    type: 'success' | 'error'
    message: string
    details?: string[]
  } | null>(null)

  const formatAttempt = (attempt: PushAttemptResult) => {
    if (attempt.ok) return `Delivered to ${attempt.deviceId}.`

    const status = attempt.statusCode ? ` (${attempt.statusCode})` : ''
    const removed = attempt.deleted ? ' Subscription was removed.' : ''
    return `Failed on ${attempt.deviceId}${status}: ${attempt.error ?? 'Unknown error.'}${removed}`
  }

  const sendNotification = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const cleanTitle = title.trim()
    const cleanBody = body.trim()
    if (!cleanTitle || !cleanBody) {
      setSendResult({ type: 'error', message: 'Title and body are required.' })
      return
    }

    setSending(true)
    setSendResult(null)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    const publicCronSecret = process.env.NEXT_PUBLIC_CRON_SECRET?.trim()
    if (publicCronSecret) {
      headers.Authorization = ['Bearer', publicCronSecret].join(' ')
    }

    try {
      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: cleanTitle,
          body: cleanBody,
        }),
      })
      const payload = (await response.json().catch(() => null)) as SendPayload | null

      if (!response.ok) {
        setSendResult({
          type: 'error',
          message: payload?.error ?? 'Failed to send notification.',
        })
        return
      }

      if ((payload?.total ?? 0) === 0) {
        setSendResult({
          type: 'success',
          message: 'Request sent, but there are no subscribed devices yet.',
        })
        return
      }

      setSendResult({
        type: 'success',
        message:
          (payload?.failed ?? 0) > 0
            ? `Notification sent to ${payload?.sent ?? 0} of ${payload?.total ?? 0} device(s).`
            : `Notification sent to ${payload?.sent ?? 0} device(s).`,
        details: payload?.attempts?.map(formatAttempt),
      })
    } catch {
      setSendResult({
        type: 'error',
        message: 'Failed to send notification.',
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ padding: '24px 16px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a4a2e', marginBottom: '6px' }}>
        Settings
      </h1>
      <p style={{ fontSize: '13px', color: '#5a7a68', marginBottom: '24px', lineHeight: 1.6 }}>
        Notifications appear as banners while the app is open. On iPhone, closed-app
        reminders require iOS 16.4+, an iPhone 8 or newer, and launching the app from
        Add to Home Screen.
      </p>

      <h2 style={{
        fontSize: '12px', fontWeight: 700, color: '#1a4a2e',
        marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>
        Notification schedule (Calgary, Alberta time)
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {rules.map(rule => (
          <div key={rule.id} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '14px 16px',
            background: '#ffffff',
            border: '0.5px solid #cce4d6',
            borderRadius: '10px',
            opacity: rule.enabled ? 1 : 0.5,
            transition: 'opacity 0.15s',
          }}>
            <span style={{ fontSize: '22px', flexShrink: 0 }}>{rule.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f2419' }}>
                {rule.title}
              </div>
              <div style={{ fontSize: '11px', color: '#5a7a68', marginTop: '2px' }}>
                {rule.body}
              </div>
            </div>
            <input
              type="time"
              value={`${String(rule.triggerHour).padStart(2, '0')}:${String(rule.triggerMinute).padStart(2, '0')}`}
              onChange={e => {
                const [h, m] = e.target.value.split(':').map(Number)
                updateTime(rule.id, h, m)
              }}
              style={{
                fontSize: '12px', fontFamily: 'monospace',
                border: '0.5px solid #cce4d6', borderRadius: '6px',
                padding: '4px 6px', background: '#f0f7f3',
                color: '#1a4a2e', cursor: 'pointer', flexShrink: 0,
              }}
            />
            <button
              onClick={() => toggleRule(rule.id)}
              aria-label={rule.enabled ? 'Disable' : 'Enable'}
              style={{
                position: 'relative', width: '40px', height: '22px',
                borderRadius: '11px', border: 'none', cursor: 'pointer',
                flexShrink: 0,
                background: rule.enabled ? '#1a4a2e' : '#ccc',
                transition: 'background 0.2s',
              }}
            >
              <span style={{
                position: 'absolute',
                top: '3px',
                left: rule.enabled ? '21px' : '3px',
                width: '16px', height: '16px',
                background: '#fff', borderRadius: '50%',
                transition: 'left 0.2s',
              }} />
            </button>
          </div>
        ))}
      </div>

      <h2 style={{
        fontSize: '12px', fontWeight: 700, color: '#1a4a2e',
        marginTop: '24px', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>
        Send test notification
      </h2>

      <form
        onSubmit={sendNotification}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          background: '#ffffff',
          border: '0.5px solid #cce4d6',
          borderRadius: '10px',
          padding: '14px 16px',
        }}
      >
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Title"
          disabled={sending}
          style={{
            fontSize: '13px',
            border: '0.5px solid #cce4d6',
            borderRadius: '6px',
            padding: '8px 10px',
            background: '#f0f7f3',
            color: '#1a4a2e',
          }}
        />
        <input
          type="text"
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Body"
          disabled={sending}
          style={{
            fontSize: '13px',
            border: '0.5px solid #cce4d6',
            borderRadius: '6px',
            padding: '8px 10px',
            background: '#f0f7f3',
            color: '#1a4a2e',
          }}
        />
        <button
          type="submit"
          disabled={sending}
          style={{
            background: sending ? '#89a899' : '#1a4a2e',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 12px',
            fontWeight: 700,
            cursor: sending ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            alignSelf: 'flex-start',
          }}
        >
          {sending ? 'Sending...' : 'Send notification'}
        </button>
        {sendResult && (
          <div
            style={{
              fontSize: '12px',
              color: sendResult.type === 'success' ? '#1a4a2e' : '#842029',
              background: sendResult.type === 'success' ? '#e8f5ed' : '#f8d7da',
              border: `0.5px solid ${sendResult.type === 'success' ? '#b8ddc8' : '#f1aeb5'}`,
              borderRadius: '8px',
              padding: '8px 10px',
              lineHeight: 1.5,
            }}
          >
             <div>{sendResult.message}</div>
             {sendResult.details && sendResult.details.length > 0 && (
               <ul style={{ margin: '8px 0 0', paddingLeft: '18px' }}>
                 {sendResult.details.map(detail => (
                   <li key={detail}>{detail}</li>
                 ))}
               </ul>
             )}
           </div>
        )}
      </form>

      <div style={{
        marginTop: '24px', padding: '14px 16px',
        background: '#e8f5ed', borderRadius: '12px',
        fontSize: '12px', color: '#1a4a2e', lineHeight: 1.7,
        border: '0.5px solid #b8ddc8',
      }}>
        <strong>About push notifications:</strong> To receive notifications when
        the app is closed, use Safari on an iPhone running iOS 16.4+ (iPhone 8 or
        newer), tap the Share button, and select &#34;Add to Home Screen&#34;. Then reopen
        the app from your home screen and allow notifications there. Older devices,
        including iPhone 6, cannot receive web push notifications for home screen apps.
      </div>
    </div>
  )
}