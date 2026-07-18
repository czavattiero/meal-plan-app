import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json(
      { error: 'Query must be at least 2 characters' },
      { status: 400 }
    )
  }

  const db = createServerClient()

  const { data, error } = await db.rpc('search_foods', {
    search_term: q,
    result_limit: 10,
  })

  if (error) {
    console.error('lookup query error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }

  return NextResponse.json({ query: q, results: data ?? [] })
}
