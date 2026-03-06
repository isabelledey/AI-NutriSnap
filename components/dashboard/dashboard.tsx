'use client'

import { useState, useEffect, useCallback } from 'react'
import type { UserProfile, DailyLog, MealSuggestion, MealAnalysis } from '@/lib/types'
import { getDailyLog, saveDailyLog, saveMealToLog, fetchDailyLogFromSupabase, syncMealToSupabase, removeMealFromSupabase } from '@/lib/store'
import { getTotalConsumed, calculateRemainingCalories } from '@/lib/nutrition'
import { CalorieRing } from './calorie-ring'
import { MealCard } from './meal-card'
import { SuggestionCard } from './suggestion-card'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Camera, Beef, Wheat, Droplets } from 'lucide-react'
import { toast } from 'sonner'

interface DashboardProps {
  profile: UserProfile
  onAddMeal: () => void
}

export function Dashboard({ profile, onAddMeal }: DashboardProps) {
  const [dailyLog, setDailyLog] = useState<DailyLog>(getDailyLog())
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  const consumed = getTotalConsumed(dailyLog.meals)
  const remaining = calculateRemainingCalories(profile.dailyCalorieTarget, consumed.calories)

  const fetchSuggestions = useCallback(async () => {
    setLoadingSuggestions(true)
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          remainingCalories: remaining,
          preferences: profile.foodPreferences,
          profile,
          consumedToday: {
            calories: consumed.calories,
            protein: consumed.protein,
            carbs: consumed.carbs,
            fat: consumed.fat,
          },
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSuggestions(data.suggestions)
      }
    } catch {
      // Silent fail for suggestions
    } finally {
      setLoadingSuggestions(false)
    }
  }, [
    remaining,
    profile,
    consumed.calories,
    consumed.protein,
    consumed.carbs,
    consumed.fat,
  ])

  useEffect(() => {
    fetchSuggestions()
  }, [fetchSuggestions])

  useEffect(() => {
    let ignore = false
    const loadFromSupabase = async () => {
      const remoteLog = await fetchDailyLogFromSupabase(profile.email)
      if (remoteLog && !ignore) {
        saveDailyLog(remoteLog)
        setDailyLog(remoteLog)
      }
    }
    void loadFromSupabase()
    return () => {
      ignore = true
    }
  }, [profile.email])

  const handleAddSuggestion = async (suggestion: MealSuggestion) => {
    const meal: MealAnalysis = {
      name: suggestion.name,
      calories: suggestion.calories,
      protein: suggestion.protein,
      carbs: suggestion.carbs,
      fat: suggestion.fat,
      fiber: 0,
      items: [
        {
          name: suggestion.name,
          portion: '1 serving',
          calories: suggestion.calories,
          protein: suggestion.protein,
          carbs: suggestion.carbs,
          fat: suggestion.fat,
        },
      ],
      timestamp: new Date().toISOString(),
    }

    saveMealToLog(meal)
    await syncMealToSupabase(profile.email, meal)
    const updatedLog = getDailyLog()
    setDailyLog(updatedLog)
    setSuggestions((prev) => prev.filter((s) => s.name !== suggestion.name))
    toast.success(`${suggestion.name} added to your log!`)
  }

  const handleRemoveMeal = async (mealIndex: number) => {
    const mealToRemove = dailyLog.meals[mealIndex]
    if (!mealToRemove) return

    if (mealToRemove.id) {
      await removeMealFromSupabase(mealToRemove.id)
    }

    const updatedMeals = dailyLog.meals.filter((_, index) => index !== mealIndex)
    const updatedLog: DailyLog = { ...dailyLog, meals: updatedMeals }
    saveDailyLog(updatedLog)
    setDailyLog(updatedLog)
    toast.success('Meal removed from your log.')
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background px-6 pb-24 pt-6">
      {/* Header */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">{today}</p>
        <h1 className="text-2xl font-bold text-foreground">
          Hi{profile.name ? `, ${profile.name}` : ''}!
        </h1>
      </div>

      {/* Calorie ring section */}
      <div className="mb-6 flex flex-col items-center">
        <CalorieRing consumed={consumed.calories} target={profile.dailyCalorieTarget} />

        {/* Macro summary */}
        <div className="mt-4 grid w-full max-w-xs grid-cols-3 gap-3">
          <Card className="flex flex-col items-center rounded-2xl border-border bg-card p-3">
            <Beef className="mb-1 h-4 w-4" style={{ color: 'oklch(0.52 0.1 155)' }} />
            <span className="text-lg font-bold text-foreground">{consumed.protein}g</span>
            <span className="text-[10px] text-muted-foreground">Protein</span>
          </Card>
          <Card className="flex flex-col items-center rounded-2xl border-border bg-card p-3">
            <Wheat className="mb-1 h-4 w-4" style={{ color: 'oklch(0.75 0.14 75)' }} />
            <span className="text-lg font-bold text-foreground">{consumed.carbs}g</span>
            <span className="text-[10px] text-muted-foreground">Carbs</span>
          </Card>
          <Card className="flex flex-col items-center rounded-2xl border-border bg-card p-3">
            <Droplets className="mb-1 h-4 w-4" style={{ color: 'oklch(0.72 0.14 40)' }} />
            <span className="text-lg font-bold text-foreground">{consumed.fat}g</span>
            <span className="text-[10px] text-muted-foreground">Fat</span>
          </Card>
        </div>
      </div>

      {/* Today's Meals */}
      <div className="mb-6">
        <h2 className="mb-3 text-base font-semibold text-foreground">{"Today's"} Meals</h2>
        {dailyLog.meals.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 rounded-2xl border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">No meals logged yet today</p>
            <p className="text-xs text-muted-foreground">Snap a photo to get started!</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {dailyLog.meals.map((meal, i) => (
              <MealCard key={i} meal={meal} index={i} onRemove={() => handleRemoveMeal(i)} />
            ))}
          </div>
        )}
      </div>

      {/* Suggested Next Meals */}
      <div className="mb-6">
        <h2 className="mb-3 text-base font-semibold text-foreground">Suggested Next Meals</h2>
        {loadingSuggestions ? (
          <div className="flex flex-col gap-3">
            {[1, 2].map((n) => (
              <Card key={n} className="h-28 animate-pulse rounded-2xl border-border bg-muted" />
            ))}
          </div>
        ) : suggestions.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 rounded-2xl border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">
              {consumed.calories >= profile.dailyCalorieTarget
                ? "You've reached your calorie goal for today!"
                : 'No suggestions available right now.'}
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {suggestions.map((s, i) => (
              <SuggestionCard key={i} suggestion={s} onAdd={handleAddSuggestion} />
            ))}
          </div>
        )}
      </div>

      {/* Floating add meal button */}
      <div className="fixed right-6 bottom-6 z-50">
        <Button
          onClick={onAddMeal}
          className="h-14 w-14 rounded-2xl shadow-lg shadow-primary/30"
          size="icon"
        >
          <Camera className="h-6 w-6" />
          <span className="sr-only">Add new meal</span>
        </Button>
      </div>
    </div>
  )
}
