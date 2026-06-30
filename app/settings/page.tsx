'use client'
import { useNotifications } from '@/hooks/useNotifications'

export default function SettingsPage() {
  const { rules, toggleRule, updateTime } = useNotifications()

  return (
    <div style={{ padding: '24px 16px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a4a2e', marginBottom: '6px' }}>
        Settings
      </h1>
      <p style={{ fontSize: '13px', color: '#5a7a68', marginBottom: '24px', lineHeight: 1.6 }}>
        Notifications appear as banners while the app is open. On iPhone (iOS 16.4+,
        installed via Add to Home Screen), they also fire when the app is closed.
      </p>

      <h2 style={{
        fontSize: '12px', fontWeight: 700, color: '#1a4a2e',
        marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>
        Notification schedule
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

      <div style={{
        marginTop: '24px', padding: '14px 16px',
        background: '#e8f5ed', borderRadius: '12px',
        fontSize: '12px', color: '#1a4a2e', lineHeight: 1.7,
        border: '0.5px solid #b8ddc8',
      }}>
        <strong>About push notifications:</strong> To receive notifications when
        the app is closed, open the app in Safari on iPhone, tap the Share button,
        and select &quot;Add to Home Screen&quot;. Then reopen the app from your home screen
        — you will be asked to allow notifications.
      </div>
    </div>
  )
}