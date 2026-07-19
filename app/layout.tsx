import type { Metadata, Viewport } from 'next'
import './globals.css'
import NotificationProvider from '@/components/NotificationProvider'
import NavBar from '@/components/NavBar'

export const metadata: Metadata = {
  title: "Sophia's Meal Plan",
  description: 'Sophia's meal plan',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Meal Plan',
  },
}

export const viewport: Viewport = {
  themeColor: '#2b0a5e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body style={{
        margin: 0,
        fontFamily: 'system-ui, sans-serif',
        background: '#f0f7f3',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <NotificationProvider>
          <main style={{
            flex: 1,
            maxWidth: '680px',
            margin: '0 auto',
            width: '100%',
            paddingBottom: '80px',
          }}>
            {children}
          </main>
          <NavBar />
        </NotificationProvider>
      </body>
    </html>
  )
}
