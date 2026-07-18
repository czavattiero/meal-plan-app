'use client'

import { useEffect, useState, useCallback } from 'react'

type Food = {
  id: number
  name: string
  category: string | null
  calories: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  fiber_g: number | null
  sugar_g: number | null
  sodium_mg: number | null
}

const NUTRIENT_PRESETS: { label: string; nutrient: string; direction: 'asc' | 'desc' }[] = [
  { label: 'High Protein', nutrient: 'protein_g', direction: 'desc' },
  { label: 'High Fibre', nutrient: 'fiber_g', direction: 'desc' },
  { label: 'Low Carb', nutrient: 'carbs_g', direction: 'asc' },
  { label: 'Low Calorie', nutrient: 'calories', direction: 'asc' },
  { label: 'Low Sodium', nutrient: 'sodium_mg', direction: 'asc' },
]

function MacroRow({ food }: { food: Food }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-gray-900">{food.name}</p>
        {food.category && (
          <p className="text-xs text-gray-500 capitalize">{food.category}</p>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-1.5 text-right">
        <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-bold text-amber-700">
          {food.calories ?? '–'} kcal
        </span>
        {food.protein_g != null && (
          <span className="rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-xs font-semibold text-green-700">
            P {food.protein_g}g
          </span>
        )}
        {food.carbs_g != null && (
          <span className="rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs font-semibold text-blue-700">
            C {food.carbs_g}g
          </span>
        )}
        {food.fat_g != null && (
          <span className="rounded-full bg-purple-50 border border-purple-200 px-2 py-0.5 text-xs font-semibold text-purple-700">
            F {food.fat_g}g
          </span>
        )}
        {food.fiber_g != null && (
          <span className="rounded-full bg-teal-50 border border-teal-200 px-2 py-0.5 text-xs font-semibold text-teal-700">
            Fibre {food.fiber_g}g
          </span>
        )}
      </div>
    </div>
  )
}

export default function FoodSearch() {
  const [mode, setMode] = useState<'nutrient' | 'lookup'>('nutrient')
  const [activePreset, setActivePreset] = useState(NUTRIENT_PRESETS[0])
  const [lookupQuery, setLookupQuery] = useState('')
  const [results, setResults] = useState<Food[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchByNutrient = useCallback(async (preset: typeof NUTRIENT_PRESETS[number]) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/foods/by-nutrient?nutrient=${preset.nutrient}&direction=${preset.direction}&limit=15`
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Request failed')
      setResults(data.results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchLookup = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/foods/lookup?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Request failed')
      setResults(data.results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchByNutrient(activePreset)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (mode !== 'lookup') return
    const timer = setTimeout(() => fetchLookup(lookupQuery), 350)
    return () => clearTimeout(timer)
  }, [lookupQuery, mode, fetchLookup])

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-4 flex gap-2 rounded-full bg-gray-100 p-1">
        <button
          onClick={() => setMode('nutrient')}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
            mode === 'nutrient' ? 'bg-white shadow text-green-800' : 'text-gray-500'
          }`}
        >
          Find by nutrient
        </button>
        <button
          onClick={() => setMode('lookup')}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
            mode === 'lookup' ? 'bg-white shadow text-green-800' : 'text-gray-500'
          }`}
        >
          Look up a food
        </button>
      </div>

      {mode === 'nutrient' ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {NUTRIENT_PRESETS.map(preset => (
            <button
              key={preset.label}
              onClick={() => {
                setActivePreset(preset)
                fetchByNutrient(preset)
              }}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                activePreset.label === preset.label
                  ? 'border-green-700 bg-green-700 text-white'
                  : 'border-gray-300 text-gray-600 hover:border-green-400'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      ) : (
        <input
          type="text"
          value={lookupQuery}
          onChange={e => setLookupQuery(e.target.value)}
          placeholder="e.g. avocado, chicken thigh, greek yogurt..."
          className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
      )}

      <div className="space-y-2">
        {loading && <p className="text-sm text-gray-400">Searching…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && !error && results.length === 0 && mode === 'lookup' && lookupQuery.length >= 2 && (
          <p className="text-sm text-gray-400">No matches found.</p>
        )}
        {results.map(food => (
          <MacroRow key={food.id} food={food} />
        ))}
      </div>
    </div>
  )
}
