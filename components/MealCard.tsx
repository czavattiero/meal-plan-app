'use client'
import { useState } from 'react'
import { Meal } from '@/types'

type Props = {
  meal: Meal
  variant: 'breakfast' | 'lunch' | 'dinner'
}

const VARIANT_CONFIG = {
  breakfast: { label: '☀️ Breakfast', color: '#ffc300', bg: '#fffbe0', border: '#ffe066' },
  lunch:     { label: '🥗 Lunch',     color: '#e6007e', bg: '#f0f7f3', border: '#e0b3ff' },
  dinner:    { label: '🍽 Dinner',    color: '#00c2ff', bg: '#e0f7ff', border: '#c4b8f0' },
}

export default function MealCard({ meal, variant }: Props) {
  const [expanded, setExpanded] = useState(false)
  const cfg = VARIANT_CONFIG[variant]

  return (
    <div style={{
      border: `0.5px solid ${cfg.border}`,
      borderRadius: '12px',
      background: '#ffffff',
      overflow: 'hidden',
    }}>
      <div style={{ height: '3px', background: cfg.color }} />
      <div style={{ padding: '14px 16px' }}>
        <div style={{
          display: 'inline-block',
          fontSize: '10px', fontWeight: 700,
          padding: '2px 8px', borderRadius: '20px',
          background: cfg.bg, color: cfg.color,
          marginBottom: '8px', border: `0.5px solid ${cfg.border}`,
        }}>
          {cfg.label}
        </div>

        <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f2419', marginBottom: '6px', lineHeight: 1.3 }}>
          {meal.name}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '10px', fontWeight: 700,
            background: '#fffbe0', color: '#cc7a00',
            border: '0.5px solid #ffe066',
            padding: '2px 8px', borderRadius: '20px',
          }}>
            ~{meal.calories} kcal
          </span>
          <span style={{ fontSize: '10px', color: '#5a7a68', display: 'flex', alignItems: 'center', gap: '3px' }}>
            ⏱ {meal.prepTime} min
          </span>
          {meal.isAirFryer && (
            <span style={{
              fontSize: '10px', fontWeight: 600,
              background: '#fff3e0', color: '#8a4a00',
              border: '0.5px solid #f0c870',
              padding: '2px 8px', borderRadius: '20px',
            }}>
              🌪 Air fryer
            </span>
          )}
          {meal.isSmoothie && (
            <span style={{
              fontSize: '10px', fontWeight: 600,
              background: '#f0edff', color: '#4a3ab0',
              border: '0.5px solid #c4b8f0',
              padding: '2px 8px', borderRadius: '20px',
            }}>
              🥤 Smoothie
            </span>
          )}
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            fontSize: '12px', color: cfg.color,
            background: 'none', border: `0.5px solid ${cfg.border}`,
            borderRadius: '20px', padding: '5px 12px',
            cursor: 'pointer', fontWeight: 500,
          }}
        >
          {expanded ? 'Hide details ↑' : 'Show recipe ↓'}
        </button>

        {expanded && (
          <div style={{ marginTop: '14px' }}>
            <div style={{ marginBottom: '14px' }}>
              <div style={{
                fontSize: '11px', fontWeight: 700, color: '#e6007e',
                marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                Ingredients
              </div>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {meal.ingredients.map((ing, i) => (
                  <li key={i} style={{
                    fontSize: '12px', color: '#3d5040',
                    padding: '4px 0', borderBottom: '0.5px solid #f0f7f3',
                    display: 'flex', alignItems: 'flex-start', gap: '8px',
                  }}>
                    <span style={{ color: cfg.color, fontSize: '10px', marginTop: '2px' }}>•</span>
                    {ing}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <div style={{
                fontSize: '11px', fontWeight: 700, color: '#e6007e',
                marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                Steps
              </div>
              <ol style={{ paddingLeft: '18px' }}>
                {meal.steps.map((step, i) => (
                  <li key={i} style={{
                    fontSize: '12px', color: '#3d5040',
                    lineHeight: 1.65, marginBottom: '5px',
                  }}>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {meal.alternative && (
              <div style={{
                fontSize: '11px', color: '#6650c8',
                background: '#f0edff',
                borderLeft: '2px solid #9b8ef0',
                padding: '8px 10px',
                borderRadius: '0 8px 8px 0',
              }}>
                <strong>⇄ Alt:</strong> {meal.alternative}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}