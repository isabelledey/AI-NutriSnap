'use client'

import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'

interface CalorieRingProps {
  consumed: number
  target: number
}

export function CalorieRing({ consumed, target }: CalorieRingProps) {
  const remaining = Math.max(0, target - consumed)
  const percentage = Math.min(100, (consumed / target) * 100)
  const isOver = consumed > target

  const data = [
    {
      name: 'consumed',
      value: percentage,
      fill: isOver ? 'oklch(0.577 0.245 27.325)' : 'oklch(0.52 0.1 155)',
    },
  ]

  return (
    <div className="relative h-48 w-48">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="78%"
          outerRadius="100%"
          startAngle={90}
          endAngle={-270}
          data={data}
          barSize={12}
        >
          <RadialBar
            dataKey="value"
            cornerRadius={6}
            background={{ fill: 'oklch(0.93 0.008 75)' }}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-foreground leading-none">{remaining}</span>
        <span className="mt-1 text-xs font-medium text-muted-foreground">kcal remaining</span>
        <span className="mt-0.5 text-[10px] text-muted-foreground">
          {consumed} / {target}
        </span>
      </div>
    </div>
  )
}
