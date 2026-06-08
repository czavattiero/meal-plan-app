import Link from 'next/link'

const WEEKS = [
  {
    week: 1,
    days: 'Days 1–5',
    summary: 'Air fryer chicken, sirloin steak, ground beef skillet, All Bran breakfasts',
    kcal: '~1,080 kcal avg',
  },
  {
    week: 2,
    days: 'Days 6–10',
    summary: 'Beef stir fry, stuffed peppers, cauliflower mash, egg muffin batches',
    kcal: '~1,060 kcal avg',
  },
  {
    week: 3,
    days: 'Days 11–15',
    summary: 'Drumsticks, lentil-beef skillet, baked potato, chocolate avocado smoothie',
    kcal: '~1,055 kcal avg',
  },
]

export default function HomePage() {
  return (
    <div style={{ padding: '24px 16px' }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a4a2e 0%, #2d7a4a 100%)',
        borderRadius: '16px',
        padding: '28px 24px',
        marginBottom: '24px',
        color: '#ffffff',
      }}>
        <div style={{
          fontSize: '11px', letterSpacing: '0.2em',
          textTransform: 'uppercase', color: '#f0b429',
          marginBottom: '8px', fontWeight: 700,
        }}>
          Your plan
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 8px', lineHeight: 1.1 }}>
          15-Day<br />
          <span style={{ color: '#f0b429' }}>Meal Plan</span>
        </h1>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.5 }}>
          High protein · High fibre · Low sugar<br />
          Low sodium · ≤ 1,600 kcal/day
        </p>
      </div>

      <div style={{
        background: '#fffbeb',
        border: '0.5px solid #f5d67a',
        borderRadius: '12px',
        padding: '14px 16px',
        marginBottom: '24px',
        fontSize: '12px',
        color: '#92600a',
        lineHeight: 1.7,
      }}>
        <strong style={{
          display: 'block', marginBottom: '4px',
          color: '#c8900a', textTransform: 'uppercase',
          fontSize: '10px', letterSpacing: '0.1em',
        }}>
          Smart eating rules
        </strong>
        Always eat protein or fat before starchy foods · Cool potatoes overnight ·
        ½ banana max, always paired with protein · 10-min walk after meals ·
        Drink water before every meal
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        {WEEKS.map(w => (
          <Link key={w.week} href={`/week/${w.week}`} style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#ffffff',
              border: '0.5px solid #cce4d6',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}>
              <div style={{
                width: '48px', height: '48px',
                background: 'linear-gradient(135deg, #1a4a2e, #2d7a4a)',
                borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#f0b429', fontSize: '20px', fontWeight: 700, flexShrink: 0,
              }}>
                {w.week}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f2419', marginBottom: '2px' }}>
                  Week {w.week} · {w.days}
                </div>
                <div style={{
                  fontSize: '11px', color: '#5a7a68',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {w.summary}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#c8900a' }}>{w.kcal}</div>
                <div style={{ fontSize: '18px', color: '#2d7a4a' }}>→</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
        {[
          { val: '≤1,600', lbl: 'kcal/day' },
          { val: '15', lbl: 'recipes' },
          { val: '0', lbl: 'added sugar' },
        ].map(s => (
          <div key={s.lbl} style={{
            background: '#f0f7f3',
            borderRadius: '10px',
            padding: '12px',
            textAlign: 'center',
            border: '0.5px solid #cce4d6',
          }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#1a4a2e', marginBottom: '2px' }}>
              {s.val}
            </div>
            <div style={{
              fontSize: '10px', color: '#5a7a68',
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              {s.lbl}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}