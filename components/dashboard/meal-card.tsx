'use client'

import type { MealAnalysis } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Flame, Trash2 } from 'lucide-react'

interface MealCardProps {
  meal: MealAnalysis
  index: number
  onRemove: () => void
}

export function MealCard({ meal, index, onRemove }: MealCardProps) {
  const time = meal.timestamp
    ? new Date(meal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : `Meal ${index + 1}`

  return (
    <Card className="flex items-center gap-4 rounded-2xl border-border bg-card p-4">
      {/* Meal icon */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/20">
        <Flame className="h-5 w-5 text-accent" style={{ color: 'oklch(0.72 0.14 40)' }} />
      </div>

      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">{meal.name}</p>
        <div className="mt-1 flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {time}
          </span>
          <span className="text-xs text-muted-foreground">
            P {meal.protein}g
          </span>
          <span className="text-xs text-muted-foreground">
            C {meal.carbs}g
          </span>
          <span className="text-xs text-muted-foreground">
            F {meal.fat}g
          </span>
        </div>
      </div>

      <div className="text-right">
        <span className="text-lg font-bold text-foreground">{meal.calories}</span>
        <p className="text-[10px] text-muted-foreground">kcal</p>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="h-9 w-9 rounded-lg text-muted-foreground hover:text-destructive"
        aria-label={`Remove ${meal.name}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </Card>
  )
}
