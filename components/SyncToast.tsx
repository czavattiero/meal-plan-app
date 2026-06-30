'use client'

type Props = {
  message: string
  type: 'info' | 'offline'
}

export default function SyncToast({ message, type }: Props) {
  const isOffline = type === 'offline'
  return (
    <div style={{
      position: 'fixed',
      bottom: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: isOffline ? '#7a3a00' : '#1a4a2e',
      color: '#ffffff',
      fontSize: '12px',
      fontWeight: 500,
      padding: '8px 16px',
      borderRadius: '20px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
      whiteSpace: 'nowrap',
      zIndex: 9999,
      pointerEvents: 'none',
    }}>
      {message}
    </div>
  )
}
