'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { NotificationRule } from '@/types'
import { DEFAULT_RULES, getSavedRules, saveRules, getNotificationsDue, hasSavedRulePreferences } from '@/lib/notifications'
import { syncNotificationRules } from './usePushSubscription'

export function useNotifications() {
  const [rules, setRules] = useState<NotificationRule[]>(DEFAULT_RULES)
  const [active, setActive] = useState<NotificationRule[]>([])
  const [loaded, setLoaded] = useState(false)
  const initialSyncDone = useRef(false)

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setRules(getSavedRules())
      setLoaded(true)
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [])

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
    const timeoutId = window.setTimeout(check, 0)
    const interval = setInterval(check, 60000)

    return () => {
      clearTimeout(timeoutId)
      clearInterval(interval)
    }
  }, [check])

  useEffect(() => {
    if (!loaded) return
    if (!initialSyncDone.current) {
      initialSyncDone.current = true
      // Only sync on load when the user has previously saved explicit preferences.
      // Without this guard, every new subscriber would silently receive all default
      // notifications because DEFAULT_RULES are all enabled.
      if (hasSavedRulePreferences()) {
        void syncNotificationRules(rules)
      }
      return
    }
    // After the initial load, always sync on user-triggered rule changes.
    void syncNotificationRules(rules)
  }, [loaded, rules])

  const toggleRule = (id: string) => {
    const updated = rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r)
    setRules(updated)
    saveRules(updated)
  }

  const updateTime = (id: string, hour: number, minute: number) => {
    const normalizedMinute = minute >= 30 ? 30 : 0
    const updated = rules.map(r =>
      r.id === id
        ? { ...r, triggerHour: hour, triggerMinute: normalizedMinute }
        : r
    )
    setRules(updated)
    saveRules(updated)
  }

  return { rules, active, dismiss, toggleRule, updateTime }
}