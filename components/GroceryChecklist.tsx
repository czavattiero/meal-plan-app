'use client'
import { GroceryItem } from '@/types'
import { useChecklist } from '@/hooks/useChecklist'

type Props = {
  week: number
  items: GroceryItem[]
}

const CATEGORY_LABELS: Record<GroceryItem['category'], string> = {
  meat: '🥩 Meat & Poultry',
  vegetables: '🥦 Vegetables',
  dairy: '🥛 Dairy & Eggs',
  legumes: '🫘 Legumes',
  fats: '🥑 Fats & Nuts',
  grains: '🌾 Grains & Cereals',
  other: '🛒 Other',
}

export default function GroceryChecklist({ week, items }: Props) {
  const { toggle, isChecked, checkedCount, reset } = useChecklist(week)

  const grouped = items.reduce<Record<string, GroceryItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})

  const categories = Object.keys(grouped) as GroceryItem['category'][]
  const total = items.length

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        padding: '12px 16px',
        background: '#f0f7f3',
        borderRadius: '12px',
        border: '0.5px solid #b8ddc8',
      }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a4a2e' }}>
            {checkedCount} of {total} items
          </div>
          <div style={{ fontSize: '11px', color: '#5a7a68', marginTop: '2px' }}>
            {total - checkedCount} remaining
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '100px', height: '6px',
            background: '#d0e8d8', borderRadius: '10px', overflow: 'hidden',
          }}>
            <div style={{
              width: `${total > 0 ? (checkedCount / total) * 100 : 0}%`,
              height: '100%',
              background: '#2d7a4a',
              borderRadius: '10px',
              transition: 'width 0.3s ease',
            }} />
          </div>
          <button
            onClick={reset}
            style={{
              fontSize: '11px', color: '#5a7a68',
              background: 'none', border: '0.5px solid #b8ddc8',
              borderRadius: '20px', padding: '4px 10px', cursor: 'pointer',
            }}
          >
            Clear all
          </button>
        </div>
      </div>

      {categories.map(category => (
        <div key={category} style={{ marginBottom: '20px' }}>
          <div style={{
            fontSize: '11px', fontWeight: 700,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            color: '#2d7a4a', marginBottom: '8px',
            paddingBottom: '6px', borderBottom: '1px solid #e4f0ea',
          }}>
            {CATEGORY_LABELS[category]}
          </div>
          {grouped[category].map(item => (
            <label key={item.id} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '8px 4px', borderBottom: '0.5px solid #f0f7f3',
              cursor: 'pointer',
              opacity: isChecked(item.id) ? 0.5 : 1,
              transition: 'opacity 0.15s',
            }}>
              <input
                type="checkbox"
                checked={isChecked(item.id)}
                onChange={() => toggle(item.id)}
                style={{
                  accentColor: '#2d7a4a',
                  width: '16px', height: '16px',
                  flexShrink: 0, cursor: 'pointer',
                }}
              />
              <span style={{
                flex: 1, fontSize: '13px', color: '#1a1410',
                textDecoration: isChecked(item.id) ? 'line-through' : 'none',
              }}>
                {item.name}
              </span>
              <span style={{ fontSize: '11px', color: '#888', whiteSpace: 'nowrap' }}>
                {item.quantity}
              </span>
            </label>
          ))}
        </div>
      ))}
    </div>
  )
}