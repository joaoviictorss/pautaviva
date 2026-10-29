import { CircleAlertIcon, ListChecksIcon } from 'lucide-react'

import { FilterChips } from '@/components/filter-chips'
import { PollCard } from '@/components/poll-card'
import { SiteHeader } from '@/components/site-header'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

import type { PautasLayoutProps } from '../data'

const GRID = 'grid grid-cols-[repeat(auto-fill,minmax(min(100%,310px),1fr))] gap-4'

export function Pautas({
  filters,
  statusFilter,
  onStatusFilterChange,
  categoryOptions,
  categoryFilter,
  onCategoryFilterChange,
  polls,
  loading,
  error,
}: PautasLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 text-[clamp(28px,3.2vw,38px)] font-extrabold tracking-tighter">Pautas</h1>
          <p className="m-0 text-[15px] text-muted-foreground">
            Veja o que está em votação na sua comunidade e dê a sua opinião.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterChips label="Situação" chips={filters} value={statusFilter} onChange={onStatusFilterChange} />
          <Select
            items={categoryOptions}
            value={categoryFilter}
            onValueChange={(value) => value && onCategoryFilterChange(value)}
          >
            <SelectTrigger aria-label="Categoria" className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
              <PollCard key={poll.id} poll={poll} linked />
            ))}
          </div>
        ) : (
          <Empty className="rounded-2xl border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ListChecksIcon />
              </EmptyMedia>
              <EmptyTitle>Nenhuma pauta encontrada para os critérios informados</EmptyTitle>
              <EmptyDescription>Ajuste os filtros de situação ou de categoria.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </main>
    </div>
  )
}
