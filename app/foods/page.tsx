import FoodSearch from '@/components/FoodSearch'

export default function FoodsPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <h1 className="mb-6 text-center text-2xl font-bold text-green-900">Food Lookup</h1>
      <FoodSearch />
    </main>
  )
}
