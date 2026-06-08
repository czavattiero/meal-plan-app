export type MealType = 'breakfast' | 'lunch' | 'dinner'

export type Meal = {
  id: string
  name: string
  type: MealType
  calories: number
  prepTime: number
  ingredients: string[]
  steps: string[]
  alternative?: string
  tags: string[]
  hasAvocado?: boolean
  isAirFryer?: boolean
  isSmoothie?: boolean
}

export type DayPlan = {
  day: number
  breakfast: Meal
  lunch: Meal
  dinner: Meal
  leftover?: string
}

export type WeekPlan = {
  week: number
  days: DayPlan[]
  snacks: Snack[]
  groceryList: GroceryItem[]
}

export type Snack = {
  id: string
  name: string
  calories: number
  note: string
  alternative?: string
}

export type GroceryItem = {
  id: string
  name: string
  quantity: string
  category: 'meat' | 'vegetables' | 'dairy' | 'legumes' | 'fats' | 'grains' | 'other'
}

export type ChecklistState = Record<string, boolean>

export type NotificationRule = {
  id: string
  title: string
  body: string
  icon: string
  triggerHour: number
  triggerMinute: number
  daysOfWeek: number[]
  enabled: boolean
}