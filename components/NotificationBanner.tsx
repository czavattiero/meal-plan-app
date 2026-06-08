'use client'
import { NotificationRule } from '@/types'

type Props = {
  notifications: NotificationRule[]
  onDismiss: (id: string) => void
}

export default function NotificationBanner({ notifications, onDismiss }: Props) {
  if (notifications.length === 0) return null

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      padding: '10px 16px',
      pointerEvents: 'none',
    }}>
      {notifications.map(n => (
        <div key={n.id} style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          padding: '12px 14px',
          background: '#1a4a2e',
          borderRadius: '12px',
          color: '#ffffff',
          pointerEvents: 'auto',
          animation: 'slideDown 0.3s ease',
        }}>
          <span style={{ fontSize: '22px', flexShrink: 0 }}>{n.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '2px' }}>
              {n.title}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.85, lineHeight: 1.5 }}>
              {n.body}
            </div>
          </div>
          <button
            onClick={() => onDismiss(n.id)}
            aria-label="Dismiss notification"
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: '6px',
              color: '#ffffff',
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: '12px',
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>
      ))}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}