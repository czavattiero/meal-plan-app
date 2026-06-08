'use client'
import { useState, useEffect, useCallback } from 'react'
import { getChecklist, toggleItem, resetChecklist } from '@/lib/checklist'
import { ChecklistState } from '@/types'

export function useChecklist(week: number) {
  const [state, setState] = useState<ChecklistState>({})

  useEffect(() => {
    setState(getChecklist(week))
  }, [week])

  const toggle = useCallback((itemId: string) => {
    setState(toggleItem(week, itemId))
  }, [week])

  const reset = useCallback(() => {
    resetChecklist(week)
    setState({})
  }, [week])

  const isChecked = (itemId: string) => !!state[itemId]

  const checkedCount = Object.values(state).filter(Boolean).length

  return { state, toggle, reset, isChecked, checkedCount }
}