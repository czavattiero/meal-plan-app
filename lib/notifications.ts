import { NotificationRule } from '@/types'

const PREFS_KEY = 'meal-plan-notification-prefs'
const FIRED_KEY = 'meal-plan-notifications-fired'

export const DEFAULT_RULES: NotificationRule[] = [
  {
    id: 'breakfast',
    title: 'Good morning',
    body: "Don't forget to eat protein before any starchy foods today.",
    icon: '☀️',
    triggerHour: 8,
    triggerMinute: 0,
    daysOfWeek: [0,1,2,3,4,5,6],
    enabled: true,
  },
  {
    id: 'lunch',
    title: 'Lunch time',
    body: 'Time for lunch — drink a glass of water first.',
    icon: '🥗',
    triggerHour: 12,
    triggerMinute: 0,
    daysOfWeek: [0,1,2,3,4,5,6],
    enabled: true,
  },
  {
    id: 'dinner',
    title: 'Dinner prep time',
    body: 'Start prepping dinner — most meals take 15–25 min.',
    icon: '🍽',
    triggerHour: 17,
    triggerMinute: 30,
    daysOfWeek: [0,1,2,3,4,5,6],
    enabled: true,
  },
  {
    id: 'water',
    title: 'Hydration check',
    body: 'Drink a glass of water before your next meal.',
    icon: '💧',
    triggerHour: 14,
    triggerMinute: 0,
    daysOfWeek: [0,1,2,3,4,5,6],
    enabled: true,
  },
  {
    id: 'grocery',
    title: 'Grocery day',
    body: 'Time to shop for the week — open your grocery checklist.',
    icon: '🛒',
    triggerHour: 9,
    triggerMinute: 0,
    daysOfWeek: [0],
    enabled: true,
  },
  {
    id: 'walk',
    title: '10-minute walk',
    body: 'Time for a walk after lunch — it significantly lowers blood glucose.',
    icon: '🚶',
    triggerHour: 12,
    triggerMinute: 30,
    daysOfWeek: [0,1,2,3,4,5,6],
    enabled: true,
  },
]

export function getSavedRules(): NotificationRule[] {
  if (typeof window === 'undefined') return DEFAULT_RULES
  try {
    const saved = localStorage.getItem(PREFS_KEY)
    if (!saved) return DEFAULT_RULES
    const prefs = JSON.parse(saved) as Record<string, Partial<NotificationRule>>
    return DEFAULT_RULES.map(rule => ({
      ...rule,
      ...(prefs[rule.id] ?? {}),
    }))
  } catch {
    return DEFAULT_RULES
  }
}

export function saveRules(rules: NotificationRule[]): void {
  if (typeof window === 'undefined') return
  const prefs: Record<string, Partial<NotificationRule>> = {}
  rules.forEach(r => {
    prefs[r.id] = {
      enabled: r.enabled,
      triggerHour: r.triggerHour,
      triggerMinute: r.triggerMinute,
    }
  })
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
}

export function getNotificationsDue(rules: NotificationRule[]): NotificationRule[] {
  const now = new Date()
  const h = now.getHours()
  const m = now.getMinutes()
  const d = now.getDay()

  let fired: Record<string, string> = {}
  try {
    fired = JSON.parse(localStorage.getItem(FIRED_KEY) || '{}')
  } catch {}

  const due = rules.filter(rule => {
    if (!rule.enabled) return false
    if (!rule.daysOfWeek.includes(d)) return false
    if (rule.triggerHour !== h || rule.triggerMinute !== m) return false
    const todayKey = `${now.toDateString()}-${h}:${m}`
    if (fired[rule.id] === todayKey) return false
    fired[rule.id] = todayKey
    return true
  })

  if (due.length > 0) {
    localStorage.setItem(FIRED_KEY, JSON.stringify(fired))
  }
  return due
}