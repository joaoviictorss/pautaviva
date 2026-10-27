import { CircleAlertIcon, ClockIcon, ListChecksIcon, PencilIcon, PlusIcon } from 'lucide-react'

import { FilterChips } from '@/components/filter-chips'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { VOTE_OPTIONS } from '@/lib/poll/votes'
import { cn } from '@/lib/utils'

import { PollDrawer } from '../components/poll-drawer'
import type { AdminPautasLayoutProps, PollCardView } from '../data'

const GRID = 'grid grid-cols-[repeat(auto-fill,minmax(min(100%,310px),1fr))] gap-4'

function PollCard({ card }: { card: PollCardView }) {
  const CategoryIcon = card.categoryLook.icon

  return (
    <Card className="gap-3.5 rounded-2xl px-4.5 py-4.5 transition hover:-translate-y-0.5 hover:shadow-lg">
      <CardHeader className="flex items-center justify-between gap-2 px-0">
        <Badge className="h-7 gap-1.5 pr-2.5 pl-2 font-semibold" style={card.categoryLook.style}>
          <CategoryIcon />
          {card.categoryName}
        </Badge>
        <Badge className={cn('h-6 px-2.5 font-semibold', card.statusClassName)}>{card.statusLabel}</Badge>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-1.5 px-0">
        <CardTitle className="text-[17px] font-bold tracking-tight text-pretty">{card.title}</CardTitle>
        <CardDescription className="line-clamp-2 leading-relaxed">{card.description}</CardDescription>
      </CardContent>

      {card.bar && (
        <CardContent className="flex items-center gap-2.5 px-0">
          <div role="img" aria-label={card.bar.label} className="flex h-2 flex-1 gap-0.5 overflow-hidden rounded-full bg-muted">
            {card.bar.segments.map((segment) => (
              <span key={segment.key} style={{ width: `${segment.percent}%`, background: segment.color }} />
            ))}
          </div>
          <span className="text-[13px] font-semibold whitespace-nowrap">{card.bar.forLabel}</span>
        </CardContent>
      )}

      <CardFooter className="min-h-9 gap-3 border-t px-0 pt-3.5 text-[13px] text-muted-foreground">
        <span className="flex-1">{card.participationsLabel ?? card.scheduleLabel}</span>
        {card.timeLabel && (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <ClockIcon className="size-3.5" />
            {card.timeLabel}
          </span>
        )}
        {card.onEdit && (
          <Button variant="outline" size="sm" onClick={card.onEdit}>
            <PencilIcon />
            Editar
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

export function AdminPautas({
  filters,
  statusFilter,
  onStatusFilterChange,
  cards,
  loading,
  error,
  onNew,
  drawer,
  onDrawerOpenChange,
  onSaved,
}: AdminPautasLayoutProps) {
  return (
    <section className="flex animate-[word-in_.35s_cubic-bezier(.16,1,.3,1)] flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 text-[clamp(28px,3.2vw,38px)] font-extrabold tracking-tighter">Pautas</h1>
          <p className="m-0 text-[15px] text-muted-foreground">Cadastre, edite e acompanhe as votações da comunidade.</p>
        </div>
        <Button onClick={onNew} className="h-11 rounded-full pr-4.5 pl-3.5 font-semibold">
          <PlusIcon />
          Nova pauta
        </Button>
      </div>

      <FilterChips label="Situação" chips={filters} value={statusFilter} onChange={onStatusFilterChange} />

      {error ? (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : loading ? (
        <div className={GRID}>
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : cards.length ? (
        <div className={GRID}>
          {cards.map((card) => (
            <PollCard key={card.id} card={card} />
          ))}
        </div>
      ) : (
        <Empty className="rounded-2xl border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ListChecksIcon />
            </EmptyMedia>
            <EmptyTitle>Nenhuma pauta encontrada</EmptyTitle>
            <EmptyDescription>Ajuste a busca ou o filtro, ou cadastre uma nova pauta.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {VOTE_OPTIONS.map((option) => (
          <span key={option.key} className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-[3px]" style={{ background: option.color }} />
            {option.label}
          </span>
        ))}
        <span>Resultados agregados — votos individuais não são exibidos.</span>
      </div>

      <PollDrawer {...drawer} onOpenChange={onDrawerOpenChange} onSaved={onSaved} />
    </section>
  )
}
