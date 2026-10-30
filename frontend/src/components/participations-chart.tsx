import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts'

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

const CHART_CONFIG = { count: { label: 'Participações', color: 'var(--primary)' } } satisfies ChartConfig

interface ParticipationsChartProps {
  days: { label: string; count: number }[]
  caption: string
  className?: string
  /** Destaca a última barra (o dia atual). */
  highlightLast?: boolean
}

export function ParticipationsChart({ days, caption, className, highlightLast }: ParticipationsChartProps) {
  return (
    <>
      <ChartContainer config={CHART_CONFIG} className={className}>
        <BarChart data={days} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis allowDecimals={false} tickCount={3} tickLine={false} axisLine={false} width={28} />
          <ChartTooltip cursor={{ fill: 'var(--muted)' }} content={<ChartTooltipContent />} />
          <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]}>
            {days.map((day, index) => (
              <Cell key={day.label} fillOpacity={highlightLast && index === days.length - 1 ? 1 : 0.35} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
      <table className="sr-only">
        <caption>{caption}</caption>
        <tbody>
          {days.map((day) => (
            <tr key={day.label}>
              <th scope="row">{day.label}</th>
              <td>{day.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
