import { ChecklistState } from '@/types'
import { supabase } from '@/lib/supabase'

const KEY_PREFIX = 'meal-plan-checklist-week-'

export function getChecklist(week: number): ChecklistState {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(KEY_PREFIX + week) || '{}')
  } catch {
    return {}
  }
}

export function setChecklist(week: number, state: ChecklistState): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY_PREFIX + week, JSON.stringify(state))
}

export function toggleItem(week: number, itemId: string): ChecklistState {
  const current = getChecklist(week)
  const updated = { ...current, [itemId]: !current[itemId] }
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

export function stateHash(state: ChecklistState): string {
  const json = JSON.stringify(state, Object.keys(state).sort())
  return `${json.length}:${json.slice(0, 50)}`
}

export async function loadChecklistFromSupabase(week: number): Promise<ChecklistState | null> {
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('checklist_state')
      .select('state')
      .eq('week', week)
      .single()
    if (error || !data) return null
    return data.state as ChecklistState
  } catch {
    return null
  }
}

export async function saveChecklistToSupabase(week: number, state: ChecklistState): Promise<boolean> {
  if (!supabase) return false
  try {
    const { error } = await supabase
      .from('checklist_state')
      .upsert({ week, state, updated_at: new Date().toISOString() }, { onConflict: 'week' })
    return !error
  } catch {
    return false
  }
}