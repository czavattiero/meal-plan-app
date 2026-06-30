'use client'
import { useState, useEffect, useCallback } from 'react'
import { NotificationRule } from '@/types'
import { getSavedRules, saveRules, getNotificationsDue } from '@/lib/notifications'

export function useNotifications() {
  const [rules, setRules] = useState<NotificationRule[]>(() => getSavedRules())
  const [active, setActive] = useState<NotificationRule[]>([])

  const dismiss = useCallback((id: string) => {
    setActive(prev => prev.filter(n => n.id !== id))
  }, [])

  const check = useCallback(() => {
    if (rules.length === 0) return
    const due = getNotificationsDue(rules)
    if (due.length > 0) {
      setActive(prev => [...prev, ...due])
      due.forEach(n => setTimeout(() => dismiss(n.id), 6000))
    }
  }, [rules, dismiss])

  useEffect(() => {
    const initialCheck = window.setTimeout(check, 0)
    const interval = setInterval(check, 60000)

    return () => {
      window.clearTimeout(initialCheck)
      clearInterval(interval)
    }
  }, [check])

  const toggleRule = (id: string) => {
    const updated = rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r)
    setRules(updated)
    saveRules(updated)
  }

  const updateTime = (id: string, hour: number, minute: number) => {
    const updated = rules.map(r => r.id === id ? { ...r, triggerHour: hour, triggerMinute: minute } : r)
    setRules(updated)
    saveRules(updated)
  }

  return { rules, active, dismiss, toggleRule, updateTime }
}