'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getChecklist, setChecklist, toggleItem, resetChecklist,
  loadChecklistFromSupabase, saveChecklistToSupabase, stateHash,
} from '@/lib/checklist'
import { ChecklistState } from '@/types'

type ToastData = { message: string; type: 'info' | 'offline' }
type Toast = ToastData | null

const DEBOUNCE_MS = 1500
const POLL_MS = 10_000
const RETRY_MS = 10_000

export function useChecklist(week: number) {
  const [state, setState] = useState<ChecklistState>({})
  const [toast, setToast] = useState<Toast>(null)

  // refs so callbacks always see fresh values without triggering re-renders
  const stateRef = useRef<ChecklistState>({})
  const lastSyncedHashRef = useRef<string>('')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((message: string, type: ToastData['type'] = 'info') => {
    setToast({ message, type })
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(null), 3000)
  }, [])

  const applyState = useCallback((next: ChecklistState) => {
    stateRef.current = next
    setState(next)
    setChecklist(week, next)
    lastSyncedHashRef.current = stateHash(next)
  }, [week])

  // ── Initial load ──────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false

    async function load() {
      // 1. Paint from localStorage immediately (inside async fn to satisfy lint rule)
      const local = getChecklist(week)
      stateRef.current = local
      if (!cancelled) setState(local)

      // 2. Fetch from Supabase in background
      const remote = await loadChecklistFromSupabase(week)
      if (cancelled) return

      if (remote === null) {
        // Supabase unreachable — record local hash and retry later
        lastSyncedHashRef.current = stateHash(local)
        retryTimerRef.current = setTimeout(load, RETRY_MS)
        return
      }

      // Remote fetched — use it as source of truth
      applyState(remote)
    }

    load()

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [week])

  // ── Polling ───────────────────────────────────────────────────────────────

  useEffect(() => {
    pollIntervalRef.current = setInterval(async () => {
      const remote = await loadChecklistFromSupabase(week)
      if (remote === null) return

      const remoteHash = stateHash(remote)
      if (remoteHash !== lastSyncedHashRef.current) {
        applyState(remote)
        showToast('Checklist updated on another device')
      }
    }, POLL_MS)

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [week, applyState, showToast])

  // ── Cleanup ───────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [])

  // ── Actions ───────────────────────────────────────────────────────────────

  const scheduleSave = useCallback((next: ChecklistState) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      const ok = await saveChecklistToSupabase(week, next)
      if (!ok) {
        showToast('Offline — saved locally', 'offline')
      } else {
        lastSyncedHashRef.current = stateHash(next)
      }
    }, DEBOUNCE_MS)
  }, [week, showToast])

  const toggle = useCallback((itemId: string) => {
    const next = toggleItem(week, itemId)
    stateRef.current = next
    setState(next)
    scheduleSave(next)
  }, [week, scheduleSave])

  const reset = useCallback(() => {
    resetChecklist(week)
    const empty: ChecklistState = {}
    stateRef.current = empty
    setState(empty)
    scheduleSave(empty)
  }, [week, scheduleSave])

  const isChecked = (itemId: string) => !!state[itemId]

  const checkedCount = Object.values(state).filter(Boolean).length

  return { state, toggle, reset, isChecked, checkedCount, toast }
}