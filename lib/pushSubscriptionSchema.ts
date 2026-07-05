type SupabaseErrorLike = {
  code?: string
  message?: string
  details?: string
  hint?: string
}

export function isMissingNotificationRulesColumnError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false

  const { code, message, details, hint } = error as SupabaseErrorLike
  const normalized = `${message ?? ''} ${details ?? ''} ${hint ?? ''}`.toLowerCase()

  if (!normalized.includes('notification_rules')) return false

  return code === 'PGRST204' || code === '42703' || normalized.includes('column')
}

export function isMissingLastNotifiedSlotColumnError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false

  const { code, message, details, hint } = error as SupabaseErrorLike
  const normalized = `${message ?? ''} ${details ?? ''} ${hint ?? ''}`.toLowerCase()

  if (!normalized.includes('last_notified_slot')) return false

  return code === 'PGRST204' || code === '42703' || normalized.includes('column')
}

