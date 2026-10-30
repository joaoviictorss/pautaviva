import { Link } from '@tanstack/react-router'
import { ArrowDownToLineIcon, ArrowLeftIcon, CircleAlertIcon, LockIcon, Share2Icon, UsersIcon } from 'lucide-react'

import { PollCountdown } from '@/components/poll-countdown'
import { PollOutcome } from '@/components/poll-outcome'
import { PollResultBars } from '@/components/poll-result-bars'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'

import { VotePanel } from '../components/vote-panel'
import { Comments } from '../components/comments'
import type { PautaLayoutProps } from '../data'

const HEADER_ACTION = 'h-10 rounded-full bg-card px-3.5 font-semibold'

export function Pauta({
  poll,
  loading,
  error,
  exportError,
  live,
  canExport,
  exportingFormat,
  categoryLook,
  statusLabel,
  statusClassName,
  startLabel,
  endLabel,
  elapsed,
  participationsLabel,
  bars,
  onVoted,
  onExport,
  onShare,
}: PautaLayoutProps) {
  const CategoryIcon = categoryLook?.icon

  return (
    <section className="flex animate-[word-in_.35s_cubic-bezier(.16,1,.3,1)] flex-col gap-6">
      <Button
        nativeButton={false}
        render={<Link to="/pautas" />}
        variant="link"
        className="w-fit px-0 font-semibold text-muted-foreground no-underline hover:text-foreground hover:no-underline"
      >
        <ArrowLeftIcon />
        Voltar para pautas
      </Button>

      {error ? (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : loading || !poll ? (
        <Skeleton className="h-80 rounded-2xl" />
      ) : (
        <>
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div className="flex max-w-180 min-w-0 flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="h-7 gap-1.5 pr-2.5 pl-2 font-semibold" style={categoryLook?.style}>
                  {CategoryIcon && <CategoryIcon />}
                  {poll.category.name}
                </Badge>
                <Badge className={`h-7 px-3 font-semibold ${statusClassName ?? ''}`}>{statusLabel}</Badge>
                {poll.status === 'OPEN' && <PollCountdown endsAt={poll.endsAt} />}
              </div>
              <h1 className="m-0 text-[clamp(28px,3.4vw,40px)] leading-tight font-extrabold tracking-tighter text-balance">{poll.title}</h1>
              <p className="m-0 text-base leading-relaxed text-pretty whitespace-pre-line text-muted-foreground">{poll.description}</p>
              {participationsLabel && (
                <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <UsersIcon className="size-4" />
                  {participationsLabel}
                </span>
              )}
            </div>
            {poll.status === 'CLOSED' && canExport && (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className={HEADER_ACTION} disabled={!!exportingFormat} onClick={() => onExport('csv')}>
                  <ArrowDownToLineIcon />
                  {exportingFormat === 'csv' ? 'Gerando CSV...' : 'CSV'}
                </Button>
                <Button variant="outline" className={HEADER_ACTION} disabled={!!exportingFormat} onClick={() => onExport('pdf')}>
                  <ArrowDownToLineIcon />
                  {exportingFormat === 'pdf' ? 'Gerando PDF...' : 'PDF'}
                </Button>
              </div>
            )}
          </div>

          {exportError && (
            <Alert variant="destructive">
              <CircleAlertIcon />
              <AlertDescription>{exportError}</AlertDescription>
            </Alert>
          )}

          <div className="grid items-start gap-4 min-[1180px]:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="flex min-w-0 flex-col gap-4">
              {poll.status === 'SCHEDULED' && (
                <Card className="items-center gap-2 rounded-2xl p-8 text-center">
                  <span className="grid size-10 place-items-center rounded-xl bg-accent text-primary">
                    <LockIcon className="size-5" />
                  </span>
                  <h2 className="m-0 text-[17px] font-bold tracking-tight">A votação ainda não começou</h2>
                  <p className="m-0 text-sm text-muted-foreground">Os resultados aparecem aqui quando a pauta abrir, em {startLabel}.</p>
                </Card>
              )}
              {bars && (
                <Card className="gap-5 rounded-2xl p-5">
                  <h2 className="m-0 flex items-center gap-2.5 text-[17px] font-bold tracking-tight">
                    {poll.status === 'OPEN' ? 'Resultado parcial' : 'Resultado final'}
                    {poll.status === 'OPEN' && live && (
                      <Badge variant="outline" className="gap-1.5 font-semibold">
                        <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
                        Ao vivo
                      </Badge>
                    )}
                  </h2>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <span className="inline-flex items-baseline gap-2">
                      <span className="text-[44px] leading-none font-extrabold tracking-tighter">{bars[0].percentLabel}</span>
                      <span className="text-sm font-semibold text-muted-foreground">a favor</span>
                    </span>
                    {poll.status === 'CLOSED' && <PollOutcome results={poll.results} />}
                  </div>
                  <PollResultBars bars={bars} />
                  <span className="text-xs text-muted-foreground">Resultados agregados — votos individuais não são exibidos.</span>
                </Card>
              )}
              <Comments pollId={poll.id} commentable={poll.status === 'OPEN'} />
            </div>

            {/* em tela estreita, com votação aberta o voto vem antes dos resultados e da discussão */}
            <aside className={`flex min-w-0 flex-col gap-4 min-[1180px]:sticky min-[1180px]:top-21 min-[1180px]:order-none ${poll.status === 'OPEN' ? 'order-first' : ''}`}>
              <VotePanel poll={poll} onVoted={onVoted} />
              <Card className="gap-3 rounded-2xl p-5">
                <h2 className="m-0 text-[15px] font-bold tracking-tight">Período de votação</h2>
                <Progress value={elapsed ?? 0} aria-label="Tempo decorrido do período de votação" />
                <dl className="m-0 flex flex-col gap-1.5 text-[13px]">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Abertura</dt>
                    <dd className="m-0 text-right font-semibold">{startLabel}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Encerramento</dt>
                    <dd className="m-0 text-right font-semibold">{endLabel}</dd>
                  </div>
                </dl>
              </Card>
              <Button variant="outline" className="h-11 rounded-full bg-card font-semibold" onClick={onShare}>
                <Share2Icon />
                Compartilhar pauta
              </Button>
            </aside>
          </div>
        </>
      )}
    </section>
  )
}
