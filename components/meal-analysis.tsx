'use client'

import type { MealAnalysis } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowRight, Flame, Beef, Wheat, Droplets, Leaf, Loader2, RotateCcw } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { useTranslation } from '@/components/i18n/language-provider'

interface MealAnalysisDisplayProps {
  analysis: MealAnalysis
  imageUrl?: string
  onContinue: () => void
  onAnalyzeAgain: () => void
  isAnalyzing?: boolean
}

const MACRO_COLORS = {
  protein: 'oklch(0.52 0.1 155)',
  carbs: 'oklch(0.75 0.14 75)',
  fat: 'oklch(0.72 0.14 40)',
  fiber: 'oklch(0.55 0.1 190)',
}

export function MealAnalysisDisplay({
  analysis,
  imageUrl,
  onContinue,
  onAnalyzeAgain,
  isAnalyzing = false,
}: MealAnalysisDisplayProps) {
  const { t } = useTranslation()
  const macroData = [
    { name: t('macro_protein'), value: analysis.protein, color: MACRO_COLORS.protein },
    { name: t('macro_carbs'), value: analysis.carbs, color: MACRO_COLORS.carbs },
    { name: t('macro_fat'), value: analysis.fat, color: MACRO_COLORS.fat },
  ]

  const totalMacroGrams = analysis.protein + analysis.carbs + analysis.fat

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background px-6 pb-6 pt-20">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">{analysis.name}</h2>
        <p className="text-sm text-muted-foreground">{t('analysis_found_title')}</p>
      </div>

      {/* Photo + Calorie Ring */}
      <div className="mb-6 flex items-center gap-4">
        {imageUrl && (
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-border">
            <img src={imageUrl} alt={t('analysis_your_meal_alt')} className="h-full w-full object-cover" />
          </div>
        )}
        <div className="flex flex-1 items-center gap-4">
          <div className="relative h-24 w-24 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={macroData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={42}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {macroData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-foreground leading-none">{analysis.calories}</span>
              <span className="text-[10px] text-muted-foreground">{t('kcal_short')}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            {macroData.map((macro) => (
              <div key={macro.name} className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: macro.color }} />
                <span className="text-xs text-muted-foreground">{macro.name}</span>
                <span className="text-xs font-semibold text-foreground">{macro.value}g</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Macro breakdown bars */}
      <Card className="mb-4 rounded-2xl border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">{t('nutritional_breakdown')}</h3>
        <div className="flex flex-col gap-3">
          <MacroBar
            icon={<Beef className="h-4 w-4" />}
            label={t('macro_protein')}
            value={analysis.protein}
            total={totalMacroGrams}
            color={MACRO_COLORS.protein}
            unit="g"
          />
          <MacroBar
            icon={<Wheat className="h-4 w-4" />}
            label={t('macro_carbs')}
            value={analysis.carbs}
            total={totalMacroGrams}
            color={MACRO_COLORS.carbs}
            unit="g"
          />
          <MacroBar
            icon={<Droplets className="h-4 w-4" />}
            label={t('macro_fat')}
            value={analysis.fat}
            total={totalMacroGrams}
            color={MACRO_COLORS.fat}
            unit="g"
          />
          <MacroBar
            icon={<Leaf className="h-4 w-4" />}
            label={t('macro_fiber')}
            value={analysis.fiber}
            total={totalMacroGrams}
            color={MACRO_COLORS.fiber}
            unit="g"
          />
        </div>
      </Card>

      {/* Food items list */}
      <Card className="mb-6 rounded-2xl border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">{t('detected_items')}</h3>
        <div className="flex flex-col gap-2.5">
          {analysis.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="h-3.5 w-3.5 text-accent" />
                <div>
                  <p className="text-sm font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.portion}</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-foreground">{item.calories} {t('kcal_short')}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Actions */}
      <div className="mt-auto space-y-3 pb-4">
        <Button
          variant="outline"
          onClick={onAnalyzeAgain}
          disabled={isAnalyzing}
          className="h-12 w-full rounded-2xl text-sm font-medium"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('reanalyzing')}
            </>
          ) : (
            <>
              <RotateCcw className="mr-2 h-4 w-4" />
              {t('analyze_again')}
            </>
          )}
        </Button>
        <Button
          onClick={onContinue}
          disabled={isAnalyzing}
          className="h-14 w-full rounded-2xl text-base font-semibold shadow-lg shadow-primary/20"
        >
          {t('save_and_get_plan')}
          <ArrowRight className="ml-1 h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}

function MacroBar({
  icon,
  label,
  value,
  total,
  color,
  unit,
}: {
  icon: React.ReactNode
  label: string
  value: number
  total: number
  color: string
  unit: string
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary" style={{ color }}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium text-foreground">{label}</span>
          <span className="text-xs font-semibold text-foreground">
            {value}
            {unit}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${percentage}%`, backgroundColor: color }}
          />
        </div>
      </div>
    </div>
  )
}
