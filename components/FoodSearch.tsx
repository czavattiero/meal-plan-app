'use client'

import { useEffect, useState, useCallback } from 'react'

type Food = {
  id: number
  name: string
  category: string | null
  serving_desc: string | null
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

const COLORS = {
  greenDark: '#1a4a2e',
  greenMid: '#2d7a4a',
  greenPale: '#f0f7f3',
  greenBorder: '#cce4d6',
  ink: '#0f2419',
  muted: '#5a7a68',
  yellowPale: '#fffbeb',
  yellowBorder: '#f5d67a',
  yellowDeep: '#c8900a',
  blueBg: '#e0f0ff',
  blueText: '#1a4a7a',
  purpleBg: '#f0edff',
  purpleText: '#4a3ab0',
  tealBg: '#e0f5f2',
  tealText: '#0f6d63',
  white: '#ffffff',
}

function Chip({
  children,
  bg,
  color,
  border,
}: {
  children: React.ReactNode
  bg: string
  color: string
  border: string
}) {
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: '10px',
        fontWeight: 700,
        padding: '2px 8px',
        borderRadius: '20px',
        background: bg,
        color,
        border: `0.5px solid ${border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

function FoodRow({ food }: { food: Food }) {
  const isAlcohol = food.category === 'alcohol'
  return (
    <div
      style={{
        background: COLORS.white,
        border: `0.5px solid ${isAlcohol ? '#f0c99a' : COLORS.greenBorder}`,
        borderRadius: '12px',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: COLORS.ink, marginBottom: '2px' }}>
            {food.name}
          </div>
          {(food.category || food.serving_desc) && (
            <div style={{ fontSize: '10px', color: COLORS.muted }}>
              {food.category && <span style={{ textTransform: 'capitalize' }}>{food.category}</span>}
              {food.category && food.serving_desc && ' · '}
              {food.serving_desc && <span>per {food.serving_desc}</span>}
            </div>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
            gap: '4px',
            maxWidth: '150px',
          }}
        >
          <Chip bg={COLORS.yellowPale} color={COLORS.yellowDeep} border={COLORS.yellowBorder}>
            {food.calories ?? '–'} kcal
          </Chip>
          {food.protein_g != null && (
            <Chip bg={COLORS.greenPale} color={COLORS.greenDark} border={COLORS.greenBorder}>
              P {food.protein_g}g
            </Chip>
          )}
          {food.carbs_g != null && (
            <Chip bg={COLORS.blueBg} color={COLORS.blueText} border={COLORS.blueBg}>
              C {food.carbs_g}g
            </Chip>
          )}
          {food.fat_g != null && (
            <Chip bg={COLORS.purpleBg} color={COLORS.purpleText} border={COLORS.purpleBg}>
              F {food.fat_g}g
            </Chip>
          )}
          {food.fiber_g != null && (
            <Chip bg={COLORS.tealBg} color={COLORS.tealText} border={COLORS.tealBg}>
              Fibre {food.fiber_g}g
            </Chip>
          )}
        </div>
      </div>
      {isAlcohol && (
        <div
          style={{
            fontSize: '10px',
            fontWeight: 600,
            color: '#92600a',
            background: '#fffbeb',
            border: '0.5px solid #f5d67a',
            borderRadius: '8px',
            padding: '5px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <span>⚠️</span>
          <span>Affects blood sugar — can interact with medications</span>
        </div>
      )}
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
    <div>
      {/* Segmented tab switcher */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          background: COLORS.greenPale,
          border: `0.5px solid ${COLORS.greenBorder}`,
          borderRadius: '12px',
          padding: '4px',
          marginBottom: '16px',
        }}
      >
        {(['nutrient', 'lookup'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              flex: 1,
              border: 'none',
              borderRadius: '9px',
              padding: '10px 12px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              background: mode === m ? COLORS.greenDark : 'transparent',
              color: mode === m ? COLORS.white : COLORS.muted,
              transition: 'all 0.15s',
            }}
          >
            {m === 'nutrient' ? 'Find by nutrient' : 'Look up a food'}
          </button>
        ))}
      </div>

      {mode === 'nutrient' ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
          {NUTRIENT_PRESETS.map(preset => {
            const active = activePreset.label === preset.label
            return (
              <button
                key={preset.label}
                onClick={() => {
                  setActivePreset(preset)
                  fetchByNutrient(preset)
                }}
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '6px 12px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  border: `0.5px solid ${active ? COLORS.greenDark : COLORS.greenBorder}`,
                  background: active ? COLORS.greenDark : COLORS.white,
                  color: active ? COLORS.white : COLORS.muted,
                }}
              >
                {preset.label}
              </button>
            )
          })}
        </div>
      ) : (
        <input
          type="text"
          value={lookupQuery}
          onChange={e => setLookupQuery(e.target.value)}
          placeholder="e.g. avocado, chicken thigh, greek yogurt..."
          style={{
            width: '100%',
            boxSizing: 'border-box',
            marginBottom: '16px',
            padding: '12px 14px',
            fontSize: '13px',
            borderRadius: '12px',
            border: `0.5px solid ${COLORS.greenBorder}`,
            outline: 'none',
            color: COLORS.ink,
          }}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {loading && (
          <p style={{ fontSize: '12px', color: COLORS.muted, textAlign: 'center', padding: '12px 0' }}>
            Searching…
          </p>
        )}
        {error && (
          <p style={{ fontSize: '12px', color: '#b00020', textAlign: 'center', padding: '12px 0' }}>
            {error}
          </p>
        )}
        {!loading && !error && results.length === 0 && mode === 'lookup' && lookupQuery.length >= 2 && (
          <p style={{ fontSize: '12px', color: COLORS.muted, textAlign: 'center', padding: '12px 0' }}>
            No matches found.
          </p>
        )}
        {results.map(food => (
          <FoodRow key={food.id} food={food} />
        ))}
      </div>
    </div>
  )
}
