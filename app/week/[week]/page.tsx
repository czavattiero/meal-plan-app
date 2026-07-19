import { notFound } from 'next/navigation'
import { getWeek } from '@/lib/mealData'
import { DayPlan, Snack } from '@/types'
import MealCard from '@/components/MealCard'
import GroceryChecklist from '@/components/GroceryChecklist'

type Props = {
  params: Promise<{ week: string }>
}

export default async function WeekPage({ params }: Props) {
  const { week } = await params
  const weekNum = parseInt(week)
  const weekData = getWeek(weekNum)

  if (!weekData || weekNum < 1 || weekNum > 3) notFound()

  return (
    <div style={{ padding: '20px 16px' }}>
      <div style={{
        background: 'linear-gradient(90deg, #2b0a5e 0%, #e6007e 100%)',
        borderRadius: '14px', padding: '18px 20px',
        marginBottom: '20px', color: '#ffffff',
      }}>
        <div style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#ffc300', marginBottom: '4px' }}>
          Week {weekNum}
        </div>
        <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>
          Days {(weekNum - 1) * 5 + 1} to {weekNum * 5}
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>
          {weekData.days.length} days · {weekData.snacks.length} snack options · {weekData.groceryList.length} grocery items
        </div>
      </div>

      {weekData.days.map((day: DayPlan) => (
        <details key={day.day} style={{ marginBottom: '28px' }}>
          <summary style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            cursor: 'pointer', listStyle: 'none',
          }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '50%',
              background: '#2b0a5e', color: '#ffc300',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', fontWeight: 700, flexShrink: 0,
            }}>
              {day.day}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f2419' }}>Day {day.day}</div>
              <div style={{ fontSize: '11px', color: '#5a7a68' }}>
                {day.breakfast.calories + day.lunch.calories + day.dinner.calories} kcal meals total
              </div>
            </div>
            <div style={{ fontSize: '11px', color: '#e6007e', flexShrink: 0 }}>▼</div>
          </summary>

          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <MealCard meal={day.breakfast} variant="breakfast" />
            <MealCard meal={day.lunch} variant="lunch" />
            <MealCard meal={day.dinner} variant="dinner" />
          </div>

          {day.leftover && (
            <div style={{
              marginTop: '10px', padding: '10px 14px',
              background: '#f6e9ff', borderRadius: '8px',
              fontSize: '12px', color: '#e6007e',
              display: 'flex', gap: '8px', alignItems: 'flex-start',
            }}>
              <span>♻️</span>
              <span><strong>Leftovers:</strong> {day.leftover}</span>
            </div>
          )}
        </details>
      ))}

      <details style={{ marginBottom: '28px' }}>
        <summary style={{ cursor: 'pointer', listStyle: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#2b0a5e', margin: 0 }}>
            Week {weekNum} Snacks
          </h2>
          <span style={{ fontSize: '11px', color: '#e6007e' }}>▼</span>
        </summary>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {weekData.snacks.map((snack: Snack) => (
            <div key={snack.id} style={{
              background: '#ffffff', border: '0.5px solid #cce4d6',
              borderRadius: '10px', padding: '12px 14px',
              display: 'flex', alignItems: 'flex-start', gap: '12px',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f2419', marginBottom: '2px' }}>
                  {snack.name}
                </div>
                <div style={{ fontSize: '11px', color: '#5a7a68', lineHeight: 1.5 }}>
                  {snack.note}
                </div>
                {snack.alternative && (
                  <div style={{ fontSize: '10px', color: '#6650c8', marginTop: '4px', fontStyle: 'italic' }}>
                    Alt: {snack.alternative}
                  </div>
                )}
              </div>
              <span style={{
                fontSize: '10px', fontWeight: 700,
                background: '#fffbe0', color: '#cc7a00',
                border: '0.5px solid #ffe066',
                padding: '2px 7px', borderRadius: '20px', flexShrink: 0,
              }}>
                ~{snack.calories} kcal
              </span>
            </div>
          ))}
        </div>
      </details>

      <details>
        <summary style={{ cursor: 'pointer', listStyle: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#2b0a5e', margin: 0 }}>
            Week {weekNum} Grocery List
          </h2>
          <span style={{ fontSize: '11px', color: '#e6007e' }}>▼</span>
        </summary>
        <GroceryChecklist week={weekNum} items={weekData.groceryList} />
      </details>
    </div>
  )
}