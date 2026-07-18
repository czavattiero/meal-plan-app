import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

const SORTABLE_NUTRIENTS = new Set([
  'calories',
  'protein_g',
  'carbs_g',
  'fat_g',
  'fiber_g',
  'sugar_g',
  'sodium_mg',
])

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const nutrient = searchParams.get('nutrient') ?? 'protein_g'
  const direction = searchParams.get('direction') === 'asc' ? 'asc' : 'desc'
  const limitParam = Number(searchParams.get('limit') ?? '20')
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(limitParam, 1), 50)
    : 20
  const category = searchParams.get('category')

  if (!SORTABLE_NUTRIENTS.has(nutrient)) {
    return NextResponse.json(
      {
        error: `Invalid nutrient. Must be one of: ${[...SORTABLE_NUTRIENTS].join(', ')}`,
      },
      { status: 400 }
    )
  }

  const db = createServerClient()

  let query = db
    .from('foods')
    .select('id, name, category, serving_desc, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg')
    .not(nutrient, 'is', null)
    .order(nutrient, { ascending: direction === 'asc' })
    .limit(limit)

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query

  if (error) {
    console.error('by-nutrient query error:', error)
    return NextResponse.json({ error: 'Failed to fetch foods' }, { status: 500 })
  }

  return NextResponse.json({ nutrient, direction, results: data ?? [] })
}
