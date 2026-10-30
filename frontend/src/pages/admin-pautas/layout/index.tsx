import { CircleAlertIcon, ListChecksIcon, PlusIcon } from 'lucide-react'

import { FilterChips } from '@/components/filter-chips'
import { PageHeader } from '@/components/page-header'
import { PollCard } from '@/components/poll-card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { VoteLegend } from '@/components/vote-legend'

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
      <PageHeader title="Pautas" description="Cadastre, edite e acompanhe as votações da comunidade.">
        <Button onClick={onNew} className="h-11 rounded-full pr-4.5 pl-3.5 font-semibold">
          <PlusIcon />
          Nova pauta
        </Button>
      </PageHeader>

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
            <PollCard key={poll.id} poll={poll} onEdit={onEdit} linkTo="/admin/pautas/$pollId" />
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

      <VoteLegend />

      <PollDrawer {...drawer} onOpenChange={onDrawerOpenChange} onSaved={onSaved} />
    </section>
  )
}
