import { Link } from '@tanstack/react-router'
import { BellIcon, BellRingIcon, CircleAlertIcon, CircleCheckIcon, ListChecksIcon, LockIcon, XIcon } from 'lucide-react'

import { FilterChips } from '@/components/filter-chips'
import { PageHeader } from '@/components/page-header'
import { PollCard } from '@/components/poll-card'
import { PollOutcome } from '@/components/poll-outcome'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { VoteDialog } from '@/components/vote-dialog'
import { VoteLegend } from '@/components/vote-legend'
import type { Poll } from '@/lib/poll/types'

import type { PautasLayoutProps } from '../data'

const GRID = 'grid grid-cols-[repeat(auto-fill,minmax(min(100%,310px),1fr))] gap-4'
const ACTION = 'h-8.5 rounded-full px-3.5 font-semibold'

interface PollActionProps extends Pick<PautasLayoutProps, 'viewer' | 'onVote' | 'onToggleReminder'> {
  poll: Poll
}

function PollAction({ poll, viewer, onVote, onToggleReminder }: PollActionProps) {
  if (poll.status === 'CLOSED') return <PollOutcome results={poll.results} />
  if (viewer === 'staff') return null

  if (poll.status === 'OPEN') {
    if (poll.hasVoted) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary">
          <CircleCheckIcon className="size-4" />
          Você votou
        </span>
      )
    }
    return viewer === 'citizen' ? (
      <Button size="sm" className={ACTION} onClick={() => onVote(poll)}>Votar</Button>
    ) : (
      <Button nativeButton={false} render={<Link to="/pautas/$pollId" params={{ pollId: poll.id }} />} size="sm" className={ACTION}>
        Votar
      </Button>
    )
  }

  return viewer === 'citizen' ? (
    <Button variant={poll.hasReminder ? 'secondary' : 'outline'} size="sm" className={ACTION} onClick={() => onToggleReminder(poll)}>
      {poll.hasReminder ? <BellRingIcon /> : <BellIcon />}
      {poll.hasReminder ? 'Lembrete ativo' : 'Lembrar-me'}
    </Button>
  ) : (
    <Button
      nativeButton={false}
      render={<Link to="/entrar" search={{ redirect: `/pautas/${poll.id}` }} />}
      variant="outline"
      size="sm"
      className={ACTION}
    >
      <BellIcon />
      Lembrar-me
    </Button>
  )
}

export function Pautas({
  viewer,
  polls,
  statusFilters,
  status,
  categoryFilters,
  categoryId,
  missing,
  showMissing,
  page,
  pageSize,
  total,
  hasActiveFilters,
  voting,
  loading,
  error,
  onCategoryChange,
  onStatusChange,
  onMissingChange,
  onPageChange,
  onClearFilters,
  onVote,
  onCloseVote,
  onVoted,
  onToggleReminder,
}: PautasLayoutProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const firstItem = total === 0 ? 0 : (page - 1) * pageSize + 1
  const lastItem = Math.min(page * pageSize, total)

  return (
    <section className="flex animate-[word-in_.35s_cubic-bezier(.16,1,.3,1)] flex-col gap-6">
      <PageHeader
        title="Pautas"
        description="Consulte propostas locais, acompanhe os períodos de votação e veja os resultados parciais."
      />

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <FilterChips label="Situação" chips={statusFilters} value={status} onChange={onStatusChange} />
          {showMissing && (
            <Label className="cursor-pointer gap-2 text-sm font-semibold sm:ml-auto">
              <Switch checked={missing} onCheckedChange={onMissingChange} />
              Só as que faltam meu voto
            </Label>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <FilterChips compact label="Categoria" chips={categoryFilters} value={categoryId} onChange={onCategoryChange} />
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              <XIcon />
              Limpar filtros
            </Button>
          )}
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : loading ? (
        <div className={GRID}>
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : polls.length ? (
        <>
          <div className={GRID}>
            {polls.map((poll) => (
              <PollCard
                key={poll.id}
                poll={poll}
                citizen
                linkTo="/pautas/$pollId"
                action={<PollAction poll={poll} viewer={viewer} onVote={onVote} onToggleReminder={onToggleReminder} />}
              />
            ))}
          </div>
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="m-0 text-sm text-muted-foreground">
              Exibindo {firstItem}–{lastItem} de {total} {total === 1 ? 'pauta' : 'pautas'}
            </p>
            {totalPages > 1 && (
              <nav aria-label="Paginação das pautas" className="flex items-center gap-3">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {page} de {totalPages}
                </span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
                  Próxima
                </Button>
              </nav>
            )}
          </div>
        </>
      ) : (
        <Empty className="rounded-2xl border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ListChecksIcon />
            </EmptyMedia>
            <EmptyTitle>Nenhuma pauta encontrada</EmptyTitle>
            <EmptyDescription>Experimente alterar os filtros ou a busca.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      <VoteLegend />
      {status === 'OPEN' && (
        <p className="m-0 inline-flex items-center gap-2 text-[13px] text-muted-foreground">
          <LockIcon className="size-3.5 shrink-0" />
          Voto sigiloso. O resultado parcial é atualizado ao vivo para todos.
        </p>
      )}

      {voting && <VoteDialog key={voting.id} poll={voting} onClose={onCloseVote} onVoted={onVoted} />}
    </section>
  )
}
