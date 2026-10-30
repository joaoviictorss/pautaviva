import { CircleAlertIcon, ListChecksIcon, PlusIcon } from 'lucide-react'

import { FilterChips } from '@/components/filter-chips'
import { PollCard } from '@/components/poll-card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { VOTE_OPTIONS } from '@/lib/poll/votes'

import { PollDrawer } from '../components/poll-drawer'
import type { AdminPautasLayoutProps } from '../data'

const GRID = 'grid grid-cols-[repeat(auto-fill,minmax(min(100%,310px),1fr))] gap-4'

export function AdminPautas({
  filters,
  statusFilter,
  onStatusFilterChange,
  polls,
  onEdit,
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
      ) : polls.length ? (
        <div className={GRID}>
          {polls.map((poll) => (
            <PollCard key={poll.id} poll={poll} onEdit={onEdit} linked />
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
