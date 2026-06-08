'use client'
import { useNotifications } from '@/hooks/useNotifications'
import { usePushSubscription } from '@/hooks/usePushSubscription'
import NotificationBanner from './NotificationBanner'

export default function NotificationProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { active, dismiss } = useNotifications()
  usePushSubscription()

  return (
    <>
      <NotificationBanner notifications={active} onDismiss={dismiss} />
      {children}
    </>
  )
}