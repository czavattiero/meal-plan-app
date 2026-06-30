import { ChecklistState } from '@/types'

const KEY_PREFIX = 'meal-plan-checklist-week-'

export function normalizeChecklistState(value: unknown): ChecklistState {
  if (!value || typeof value !== 'object') return {}

  return Object.entries(value as Record<string, unknown>).reduce<ChecklistState>((acc, [key, isChecked]) => {
    if (isChecked) {
      acc[key] = true
    }

    return acc
  }, {})
}

export function getChecklist(week: number): ChecklistState {
  if (typeof window === 'undefined') return {}
  try {
    return normalizeChecklistState(JSON.parse(localStorage.getItem(KEY_PREFIX + week) || '{}'))
  } catch {
    return {}
  }
}

export function setChecklist(week: number, state: ChecklistState): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY_PREFIX + week, JSON.stringify(normalizeChecklistState(state)))
}

export function toggleChecklistState(state: ChecklistState, itemId: string): ChecklistState {
  const updated = { ...normalizeChecklistState(state) }

  if (updated[itemId]) {
    delete updated[itemId]
  } else {
    updated[itemId] = true
  }

  return updated
}

export function toggleItem(week: number, itemId: string): ChecklistState {
  const current = getChecklist(week)
  const updated = toggleChecklistState(current, itemId)
  setChecklist(week, updated)
  return updated
}

export function resetChecklist(week: number): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(KEY_PREFIX + week)
}

export function getUncheckedCount(week: number, totalItems: number): number {
  const state = getChecklist(week)
  const checkedCount = Object.values(state).filter(Boolean).length
  return totalItems - checkedCount
}