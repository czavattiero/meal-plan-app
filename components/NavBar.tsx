'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/', label: 'Plan', icon: '📅' },
  { href: '/week/1', label: 'Week 1', icon: '1️⃣' },
  { href: '/week/2', label: 'Week 2', icon: '2️⃣' },
  { href: '/week/3', label: 'Week 3', icon: '3️⃣' },
  { href: '/foods', label: 'Foods', icon: '🥗' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
]

export default function NavBar() {
  const path = usePathname()

  return (
    <nav style={{
      position: 'sticky',
      bottom: 0,
      background: '#ffffff',
      borderTop: '0.5px solid #cce4d6',
      display: 'flex',
      justifyContent: 'space-around',
      padding: '8px 0 max(8px, env(safe-area-inset-bottom))',
      zIndex: 40,
    }}>
      {NAV_ITEMS.map(item => {
        const isActive = path === item.href ||
          (item.href !== '/' && path.startsWith(item.href))
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              textDecoration: 'none',
              padding: '4px 8px',
              borderRadius: '8px',
              background: isActive ? '#f6e9ff' : 'none',
            }}
          >
            <span style={{ fontSize: '20px' }}>{item.icon}</span>
            <span style={{
              fontSize: '10px',
              fontWeight: isActive ? 700 : 400,
              color: isActive ? '#2b0a5e' : '#888',
            }}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
