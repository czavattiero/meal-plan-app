import { NotificationRule } from '@/types'

const PREFS_KEY = 'meal-plan-notification-prefs'
const FIRED_KEY = 'meal-plan-notifications-fired'
const NOTIFICATION_TIME_ZONE = 'America/Edmonton'
const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

type NotificationRulePreference = Pick<
  NotificationRule,
  'enabled' | 'triggerHour' | 'triggerMinute'
>

export type NotificationRulePreferences = Record<
  string,
  Partial<NotificationRulePreference>
>

export function getNotificationScheduleParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: NOTIFICATION_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const values = Object.fromEntries(
    parts
      .filter(part => part.type !== 'literal')
      .map(part => [part.type, part.value])
  ) as Record<string, string>

  return {
    dayOfWeek: WEEKDAY_INDEX[values.weekday] ?? 0,
    hour: Number(values.hour),
    minute: Number(values.minute),
    dateKey: `${values.year}-${values.month}-${values.day}`,
  }
}

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

function isValidHour(value: unknown): value is number {
  return Number.isInteger(value) && value >= 0 && value <= 23
}

function isValidMinute(value: unknown): value is number {
  return Number.isInteger(value) && value >= 0 && value <= 59
}

export function extractRulePreferences(
  rules: NotificationRule[]
): NotificationRulePreferences {
  const prefs: NotificationRulePreferences = {}

  rules.forEach(rule => {
    prefs[rule.id] = {
      enabled: rule.enabled,
      triggerHour: rule.triggerHour,
      triggerMinute: rule.triggerMinute,
    }
  })

  return prefs
}

export function mergeRulePreferences(
  preferences?: unknown
): NotificationRule[] {
  const prefs =
    preferences && typeof preferences === 'object'
      ? (preferences as NotificationRulePreferences)
      : {}

  return DEFAULT_RULES.map(rule => {
    const pref = prefs[rule.id]

    return {
      ...rule,
      enabled:
        typeof pref?.enabled === 'boolean' ? pref.enabled : rule.enabled,
      triggerHour: isValidHour(pref?.triggerHour)
        ? pref.triggerHour
        : rule.triggerHour,
      triggerMinute: isValidMinute(pref?.triggerMinute)
        ? pref.triggerMinute
        : rule.triggerMinute,
    }
  })
}

export function getDueRules(
  rules: NotificationRule[],
  date = new Date()
): NotificationRule[] {
  const { dayOfWeek, hour, minute } = getNotificationScheduleParts(date)

  return rules.filter(rule => {
    if (!rule.enabled) return false
    if (!rule.daysOfWeek.includes(dayOfWeek)) return false
    return rule.triggerHour === hour && rule.triggerMinute === minute
  })
}

export function getSavedRules(): NotificationRule[] {
  if (typeof window === 'undefined') return DEFAULT_RULES
  try {
    const saved = localStorage.getItem(PREFS_KEY)
    if (!saved) return DEFAULT_RULES
    return mergeRulePreferences(JSON.parse(saved))
  } catch {
    return DEFAULT_RULES
  }
}

export function saveRules(rules: NotificationRule[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(PREFS_KEY, JSON.stringify(extractRulePreferences(rules)))
}

export function getNotificationsDue(rules: NotificationRule[]): NotificationRule[] {
  const { dayOfWeek, hour, minute, dateKey } = getNotificationScheduleParts()

  let fired: Record<string, string> = {}
  try {
    fired = JSON.parse(localStorage.getItem(FIRED_KEY) || '{}')
  } catch {}

  const due = rules.filter(rule => {
    if (!rule.enabled) return false
    if (!rule.daysOfWeek.includes(dayOfWeek)) return false
    if (rule.triggerHour !== hour || rule.triggerMinute !== minute) return false
    const todayKey = `${dateKey}-${hour}:${minute}`
    if (fired[rule.id] === todayKey) return false
    fired[rule.id] = todayKey
    return true
  })

  if (due.length > 0) {
    localStorage.setItem(FIRED_KEY, JSON.stringify(fired))
  }
  return due
}