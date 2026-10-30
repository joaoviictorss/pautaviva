import { Link } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface Kpi {
  label: string
  value: string
  icon: LucideIcon
  delta?: string
  deltaTone?: 'up' | 'down' | 'neutral' | 'warning'
  note?: string
  to?: '/admin/moderacao' | '/minha-participacao'
}

const DELTA_TONES: Record<NonNullable<Kpi['deltaTone']>, string> = {
  up: 'text-[oklch(0.5_0.13_150)]',
  down: 'text-destructive',
  neutral: 'text-muted-foreground',
  warning: 'text-[oklch(0.5_0.13_70)]',
}

export function KpiCard({ kpi }: { kpi: Kpi }) {
  const content = (
    <Card className="h-full gap-3.5 rounded-2xl p-4.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-muted-foreground">{kpi.label}</span>
        <span className="grid size-8.5 shrink-0 place-items-center rounded-xl bg-accent text-primary">
          <kpi.icon className="size-4.5" />
        </span>
      </div>
      <span className="text-[32px] leading-none font-extrabold tracking-tighter">{kpi.value}</span>
      {kpi.note && (
        <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          {kpi.delta && <span className={cn('font-semibold', DELTA_TONES[kpi.deltaTone ?? 'neutral'])}>{kpi.delta}</span>}
          {kpi.note}
        </span>
      )}
    </Card>
  )

  return kpi.to ? (
    <Link to={kpi.to} className="rounded-2xl text-inherit no-underline transition hover:-translate-y-0.5 hover:no-underline">
      {content}
    </Link>
  ) : (
    content
  )
}
