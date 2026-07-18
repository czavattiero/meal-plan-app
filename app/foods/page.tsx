import FoodSearch from '@/components/FoodSearch'

export default function FoodsPage() {
  return (
    <div style={{ padding: '24px 16px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a4a2e', margin: '0 0 20px', lineHeight: 1.1 }}>
        Food Lookup
      </h1>
      <FoodSearch />
    </div>
  )
}
