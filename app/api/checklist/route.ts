import { NextResponse } from 'next/server'
import { normalizeChecklistState } from '@/lib/checklist'
import { getRedis } from '@/lib/redis'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate',
}

function getWeekFromRequest(request: Request): number | null {
  const week = Number.parseInt(new URL(request.url).searchParams.get('week') ?? '', 10)

  if (!Number.isInteger(week) || week < 1 || week > 3) {
    return null
  }

  return week
}

function getChecklistKey(week: number) {
  return `shared-checklist:week:${week}`
}

function getChecklistUpdatedAtKey(week: number) {
  return `shared-checklist:week:${week}:updated-at`
}

async function getSharedChecklistState(week: number) {
  const redis = getRedis()

  if (!redis) {
    return null
  }

  const [state, updatedAt] = await Promise.all([
    redis.hgetall(getChecklistKey(week)) as Promise<Record<string, string> | null>,
    redis.get(getChecklistUpdatedAtKey(week)) as Promise<string | null>,
  ])

  return {
    state: normalizeChecklistState(state ?? {}),
    updatedAt,
  }
}

export async function GET(request: Request) {
  const week = getWeekFromRequest(request)

  if (!week) {
    return NextResponse.json({ error: 'A valid week is required' }, { status: 400, headers: NO_STORE_HEADERS })
  }

  const result = await getSharedChecklistState(week)

  if (!result) {
    return NextResponse.json({ error: 'Shared sync is not configured' }, { status: 503, headers: NO_STORE_HEADERS })
  }

  return NextResponse.json({ shared: true, ...result }, { headers: NO_STORE_HEADERS })
}

export async function POST(request: Request) {
  const redis = getRedis()

  if (!redis) {
    return NextResponse.json({ error: 'Shared sync is not configured' }, { status: 503, headers: NO_STORE_HEADERS })
  }

  const { week, itemId } = await request.json()
  const weekNumber = Number.parseInt(String(week), 10)

  if (!Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > 3 || typeof itemId !== 'string' || itemId.length === 0) {
    return NextResponse.json({ error: 'A valid week and itemId are required' }, { status: 400, headers: NO_STORE_HEADERS })
  }

  const checklistKey = getChecklistKey(weekNumber)
  const updatedAtKey = getChecklistUpdatedAtKey(weekNumber)
  const isChecked = await redis.hget(checklistKey, itemId)

  if (isChecked) {
    await Promise.all([
      redis.hdel(checklistKey, itemId),
      redis.set(updatedAtKey, new Date().toISOString()),
    ])
  } else {
    await Promise.all([
      redis.hset(checklistKey, { [itemId]: '1' }),
      redis.set(updatedAtKey, new Date().toISOString()),
    ])
  }

  const result = await getSharedChecklistState(weekNumber)

  return NextResponse.json({ shared: true, ...result }, { headers: NO_STORE_HEADERS })
}

export async function DELETE(request: Request) {
  const redis = getRedis()

  if (!redis) {
    return NextResponse.json({ error: 'Shared sync is not configured' }, { status: 503, headers: NO_STORE_HEADERS })
  }

  const week = getWeekFromRequest(request)

  if (!week) {
    return NextResponse.json({ error: 'A valid week is required' }, { status: 400, headers: NO_STORE_HEADERS })
  }

  await Promise.all([
    redis.del(getChecklistKey(week)),
    redis.del(getChecklistUpdatedAtKey(week)),
  ])

  return NextResponse.json(
    { shared: true, state: {}, updatedAt: new Date().toISOString() },
    { headers: NO_STORE_HEADERS }
  )
}
