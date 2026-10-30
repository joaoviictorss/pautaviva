import { Link } from '@tanstack/react-router'
import { CircleAlertIcon, LockIcon, PartyPopperIcon } from 'lucide-react'

import { CategoryBars } from '@/components/category-bars'
import { KpiCard } from '@/components/kpi-card'
import { PageHeader } from '@/components/page-header'
import { ParticipationsChart } from '@/components/participations-chart'
import { PollCard } from '@/components/poll-card'
import { PollOutcome } from '@/components/poll-outcome'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { VoteDialog } from '@/components/vote-dialog'
import { VoteLegend } from '@/components/vote-legend'
import { VOTE_OPTIONS } from '@/lib/poll/votes'

import type { PainelLayoutProps, PendingPoll } from '../data'

const CARD_TITLE = 'm-0 text-[17px] font-bold tracking-tight'
const SECTION_LINK = 'text-[13px] font-semibold text-primary no-underline hover:underline'
const SPLIT_GRID = 'grid items-start gap-4 min-[1180px]:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'

function PendingVote({ item, onVote }: { item: PendingPoll; onVote: PainelLayoutProps['onVote'] }) {
  const { poll, categoryLook, timeLabel } = item

  return (
    <article className="flex flex-col gap-2.5 border-t pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge className="h-7 gap-1.5 pr-2.5 pl-2 font-semibold" style={categoryLook.style}>
          <categoryLook.icon />
          {poll.category.name}
        </Badge>
        <span className="text-[13px] text-muted-foreground">{timeLabel}</span>
      </div>
      <Link to="/pautas/$pollId" params={{ pollId: poll.id }} className="font-bold tracking-tight text-foreground no-underline hover:underline">
        {poll.title}
      </Link>
      <p className="m-0 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{poll.description}</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {VOTE_OPTIONS.map((option) => (
          <Button key={option.value} variant="outline" className="h-10 rounded-full font-semibold" onClick={() => onVote(poll, option.value)}>
            <option.icon style={{ color: option.color }} />
            {option.label}
          </Button>
        ))}
      </div>
    </article>
  )
}

export function Painel({
  firstName,
  kpis,
  pendingTotal,
  pending,
  comments,
  months,
  categories,
  results,
  voting,
  loading,
  error,
  onRetry,
  onVote,
  onCloseVote,
  onVoted,
}: PainelLayoutProps) {
  return (
    <section className="flex animate-[word-in_.35s_cubic-bezier(.16,1,.3,1)] flex-col gap-6">
      <PageHeader title={`Olá, ${firstName}`} description="Vote nas pautas abertas e acompanhe o que você já decidiu." />

      {error ? (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={onRetry}>Tentar novamente</Button>
          </AlertDescription>
        </Alert>
      ) : loading ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : (
        <>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,210px),1fr))] gap-4">
            {kpis.map((kpi) => (
              <KpiCard key={kpi.label} kpi={kpi} />
            ))}
          </div>

          <div className={SPLIT_GRID}>
            <Card className="min-w-0 gap-4 rounded-2xl p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className={`${CARD_TITLE} flex items-center gap-2`}>
                  Aguardando seu voto
                  {pendingTotal > 0 && <Badge className="h-6 bg-accent px-2 font-semibold text-accent-foreground">{pendingTotal}</Badge>}
                </h2>
                <Link to="/pautas" search={{ status: 'OPEN', missing: true }} className={SECTION_LINK}>
                  Ver todas
                </Link>
              </div>
              {pending.length ? (
                <>
                  <p className="m-0 inline-flex items-center gap-2 text-[13px] text-muted-foreground">
                    <LockIcon className="size-3.5 shrink-0" />
                    Um voto por CPF. Não é possível alterar depois.
                  </p>
                  {pending.map((item) => (
                    <PendingVote key={item.poll.id} item={item} onVote={onVote} />
                  ))}
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <PartyPopperIcon className="size-6 text-primary" />
                  <p className="m-0 font-semibold">Você está em dia</p>
                  <p className="m-0 text-sm text-muted-foreground">Não há pautas abertas esperando o seu voto.</p>
                </div>
              )}
            </Card>

            <Card className="min-w-0 gap-1.5 rounded-2xl px-5 pt-5 pb-2.5">
              <div className="flex items-baseline justify-between gap-2 pb-2">
                <h2 className={CARD_TITLE}>Seus comentários</h2>
                <Link to="/minha-participacao" search={{ tab: 'comentarios' }} className={SECTION_LINK}>
                  Ver todos
                </Link>
              </div>
              {comments.length ? (
                comments.map((comment) => (
                  <Link
                    key={comment.id}
                    to="/pautas/$pollId"
                    params={{ pollId: comment.pollId }}
                    className="flex flex-col gap-1 border-t py-3 text-inherit no-underline hover:no-underline"
                  >
                    <span className="truncate text-[13px] font-semibold">{comment.pollTitle}</span>
                    <span className="line-clamp-2 text-sm text-muted-foreground">{comment.text}</span>
                    <Badge className={`mt-0.5 h-6 w-fit px-2.5 font-semibold ${comment.statusClassName}`}>{comment.statusLabel}</Badge>
                  </Link>
                ))
              ) : (
                <p className="m-0 border-t py-3 text-sm text-muted-foreground">Você ainda não comentou em nenhuma pauta.</p>
              )}
            </Card>
          </div>

          <div className={SPLIT_GRID}>
            <Card className="min-w-0 gap-4 rounded-2xl p-5">
              <h2 className={CARD_TITLE}>Sua participação</h2>
              <ParticipationsChart days={months} caption="Suas participações por mês" className="aspect-auto h-52 w-full" highlightLast />
            </Card>
            <Card className="min-w-0 gap-4 rounded-2xl p-5">
              <h2 className={CARD_TITLE}>Temas em que você mais participa</h2>
              <CategoryBars categories={categories} empty="Suas participações aparecem aqui." />
            </Card>
          </div>

          {results.length > 0 && (
            <div className="flex flex-col gap-3.5">
              <h2 className={CARD_TITLE}>Resultados das pautas em que você votou</h2>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,310px),1fr))] gap-4">
                {results.map((poll) => (
                  <PollCard key={poll.id} poll={poll} citizen linkTo="/pautas/$pollId" action={<PollOutcome results={poll.results} />} />
                ))}
              </div>
              <VoteLegend />
              <p className="m-0 text-xs text-muted-foreground">Seu voto é anônimo — ninguém, nem a prefeitura, vê como você votou.</p>
            </div>
          )}
        </>
      )}

      {voting && (
        <VoteDialog key={voting.poll.id} poll={voting.poll} initialOption={voting.option} onClose={onCloseVote} onVoted={onVoted} />
      )}
    </section>
  )
}
