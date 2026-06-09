'use client'
import { useState } from 'react'
import { useNotifications } from '@/hooks/useNotifications'
import { subscribeToPush, usePushSubscription } from '@/hooks/usePushSubscription'
import NotificationBanner from './NotificationBanner'

export default function NotificationProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { active, dismiss } = useNotifications()
  const [showPrompt, setShowPrompt] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem('meal-plan-push-subscribed') !== 'true'
  )
  usePushSubscription()

  return (
    <>
      <NotificationBanner notifications={active} onDismiss={dismiss} />
      {showPrompt && (
        <div style={{
          background: '#1a4a2e',
          color: '#fff',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          fontSize: '13px',
        }}>
          <span>Enable meal reminders?</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={async () => {
                const permission = await Notification.requestPermission()
                if (permission === 'granted') {
                  const subscribed = await subscribeToPush()
                  setShowPrompt(!subscribed)
                  return
                }

                localStorage.removeItem('meal-plan-push-subscribed')
                setShowPrompt(permission === 'default')
              }}
              style={{
                background: '#f0b429',
                color: '#1a4a2e',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Allow
            </button>
            <button
              onClick={() => setShowPrompt(false)}
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Not now
            </button>
          </div>
        </div>
      )}
      {children}
    </>
  )
}