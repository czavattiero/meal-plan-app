'use client'
import { useState, useEffect, useCallback } from 'react'
import { getChecklist, setChecklist, resetChecklist, toggleChecklistState } from '@/lib/checklist'
import { ChecklistState } from '@/types'

const SYNC_INTERVAL_MS = 2500

type SharedChecklistResponse = {
  shared: boolean
  state: ChecklistState
}

function statesMatch(left: ChecklistState, right: ChecklistState) {
  const leftKeys = Object.keys(left)
  const rightKeys = Object.keys(right)

  if (leftKeys.length !== rightKeys.length) {
    return false
  }

  return leftKeys.every(key => left[key] === right[key])
}

export function useChecklist(week: number) {
  const [state, setState] = useState<ChecklistState>(() => getChecklist(week))
  const [isShared, setIsShared] = useState(false)

  useEffect(() => {
    if (Object.keys(state).length === 0) {
      resetChecklist(week)
      return
    }

    setChecklist(week, state)
  }, [state, week])

  useEffect(() => {
    let cancelled = false

    const sync = async () => {
      try {
        const response = await fetch(`/api/checklist?week=${week}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        })

        if (!response.ok) {
          if (!cancelled && response.status === 503) {
            setIsShared(false)
          }
          return
        }

        const data = await response.json() as SharedChecklistResponse

        if (cancelled) {
          return
        }

        setIsShared(data.shared)
        setState(prev => statesMatch(prev, data.state) ? prev : data.state)
      } catch {
        if (!cancelled) {
          setIsShared(false)
        }
      }
    }

    void sync()

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void sync()
      }
    }, SYNC_INTERVAL_MS)

    const handleFocus = () => {
      void sync()
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      cancelled = true
      window.clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [week])

  const toggle = useCallback((itemId: string) => {
    setState(prev => toggleChecklistState(prev, itemId))

    void fetch('/api/checklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ week, itemId }),
    })
      .then(async response => {
        if (!response.ok) {
          if (response.status === 503) {
            setIsShared(false)
          }
          return
        }

        const data = await response.json() as SharedChecklistResponse
        setIsShared(data.shared)
        setState(prev => statesMatch(prev, data.state) ? prev : data.state)
      })
      .catch(() => {
        setIsShared(false)
      })
  }, [week])

  const reset = useCallback(() => {
    setState({})

    void fetch(`/api/checklist?week=${week}`, {
      method: 'DELETE',
      headers: { 'Cache-Control': 'no-cache' },
    })
      .then(response => {
        if (response.status === 503) {
          setIsShared(false)
        }
      })
      .catch(() => {
        setIsShared(false)
      })
  }, [week])

  const isChecked = (itemId: string) => !!state[itemId]

  const checkedCount = Object.values(state).filter(Boolean).length

  return { state, toggle, reset, isChecked, checkedCount, isShared }
}