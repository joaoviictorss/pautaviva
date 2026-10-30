import { Link } from '@tanstack/react-router'
import { ArrowDownToLineIcon, ArrowLeftIcon, CircleAlertIcon, ExternalLinkIcon, InfoIcon, PencilIcon, Trash2Icon } from 'lucide-react'

import { ParticipationsChart } from '@/components/participations-chart'
import { RejectCommentDialog } from '@/components/reject-comment-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

import type { AdminPautaLayoutProps } from '../data'

const CARD_TITLE = 'm-0 text-[17px] font-bold tracking-tight'
const HEADER_ACTION = 'h-10 rounded-full bg-card px-3.5 font-semibold'

export function AdminPauta({
  poll,
  loading,
  error,
  live,
  categoryLook,
  statusLabel,
  statusClassName,
  participationsLabel,
  resultNote,
  emptyResultLabel,
  bars,
  barLabel,
  days,
  peakLabel,
  comments,
  pendingLabel,
  canModerate,
  onRemoveComment,
  elapsedPercent,
  startLabel,
  endLabel,
  timeLabel,
  meta,
  history,
  exportingFormat,
  exportError,
  onExport,
  removeDialog,
}: AdminPautaLayoutProps) {
  const CategoryIcon = categoryLook?.icon

  return (
    <section className="flex animate-[word-in_.35s_cubic-bezier(.16,1,.3,1)] flex-col gap-6">
      <Button
        nativeButton={false}
        render={<Link to="/admin/pautas" />}
        variant="link"
        className="w-fit px-0 font-semibold text-muted-foreground no-underline hover:text-foreground hover:no-underline"
      >
        <ArrowLeftIcon />
        Todas as pautas
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
              </div>
              <h1 className="m-0 text-[clamp(28px,3.4vw,40px)] leading-tight font-extrabold tracking-tighter text-balance">{poll.title}</h1>
              <p className="m-0 text-base leading-relaxed text-pretty whitespace-pre-line text-muted-foreground">{poll.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {poll.status === 'SCHEDULED' && (
                <Button
                  nativeButton={false}
                  render={<Link to="/admin/pautas" search={{ editar: poll.id }} />}
                  variant="outline"
                  className={HEADER_ACTION}
                >
                  <PencilIcon />
                  Editar pauta
                </Button>
              )}
              {poll.status === 'CLOSED' && (
                <>
                  <Button variant="outline" className={HEADER_ACTION} disabled={!!exportingFormat} onClick={() => onExport('csv')}>
                    <ArrowDownToLineIcon />
                    {exportingFormat === 'csv' ? 'Gerando CSV...' : 'CSV'}
                  </Button>
                  <Button variant="outline" className={HEADER_ACTION} disabled={!!exportingFormat} onClick={() => onExport('pdf')}>
                    <ArrowDownToLineIcon />
                    {exportingFormat === 'pdf' ? 'Gerando PDF...' : 'PDF'}
                  </Button>
                </>
              )}
              <Button
                nativeButton={false}
                render={<Link to="/pautas/$pollId" params={{ pollId: poll.id }} />}
                variant="outline"
                className={HEADER_ACTION}
              >
                <ExternalLinkIcon />
                Ver página pública
              </Button>
            </div>
          </div>

          {exportError && (
            <Alert variant="destructive">
              <CircleAlertIcon />
              <AlertDescription>{exportError}</AlertDescription>
            </Alert>
          )}

          <div className="grid items-start gap-4 min-[1180px]:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="flex min-w-0 flex-col gap-4">
              <Card className="gap-5 rounded-2xl p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className={`${CARD_TITLE} flex items-center gap-2.5`}>
                    {poll.status === 'CLOSED' ? 'Resultado final' : 'Resultado parcial'}
                    {poll.status === 'OPEN' && live && (
                      <Badge variant="outline" className="gap-1.5 font-semibold">
                        <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
                        Ao vivo
                      </Badge>
                    )}
                  </h2>
                  <span className="text-[13px] text-muted-foreground">{participationsLabel}</span>
                </div>
                {bars ? (
                  <>
                    <div role="img" aria-label={barLabel} className="flex h-3.5 gap-0.75 overflow-hidden rounded-full bg-muted">
                      {bars.filter((bar) => bar.percent > 0).map((bar) => (
                        <span key={bar.key} style={{ flex: bar.percent, background: bar.color }} />
                      ))}
                    </div>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
                      {bars.map((bar) => (
                        <div key={bar.key} className="flex flex-col gap-1.5 rounded-2xl bg-muted/60 p-3.5">
                          <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-muted-foreground">
                            <span className="size-2.5 rounded-[3px]" style={{ background: bar.color }} />
                            {bar.label}
                          </span>
                          <span className="text-[30px] leading-none font-extrabold tracking-tighter">{bar.percentLabel}</span>
                          <span className="text-[13px] text-muted-foreground">{bar.countLabel} {bar.countLabel === '1' ? 'voto' : 'votos'}</span>
                        </div>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">{resultNote}</span>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-dashed px-4 py-8 text-center">
                    <span className="text-base font-bold">{emptyResultLabel}</span>
                    <span className="text-sm text-muted-foreground">
                      Os resultados aparecem aqui assim que os primeiros votos chegarem.
                    </span>
                  </div>
                )}
              </Card>

              {peakLabel && (
                <Card className="gap-4.5 rounded-2xl p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className={CARD_TITLE}>Participações por dia</h2>
                    <span className="text-[13px] text-muted-foreground">{peakLabel}</span>
                  </div>
                  <ParticipationsChart days={days} caption="Participações por dia nesta pauta" className="h-42.5 w-full" />
                </Card>
              )}

              <Card className="gap-1.5 rounded-2xl px-5 pt-5 pb-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
                  <h2 className={CARD_TITLE}>
                    Comentários publicados{' '}
                    <span className="font-mono text-[13px] font-medium text-muted-foreground">{comments.length}</span>
                  </h2>
                  {pendingLabel &&
                    (canModerate ? (
                      <Link
                        to="/admin/moderacao"
                        search={{ pauta: poll.id }}
                        className="inline-flex h-7 items-center rounded-full bg-[oklch(0.95_0.05_75)] px-2.5 text-xs font-semibold text-[oklch(0.45_0.11_70)] no-underline hover:no-underline hover:brightness-95"
                      >
                        {pendingLabel}
                      </Link>
                    ) : (
                      <span className="inline-flex h-7 items-center rounded-full bg-[oklch(0.95_0.05_75)] px-2.5 text-xs font-semibold text-[oklch(0.45_0.11_70)]">
                        {pendingLabel}
                      </span>
                    ))}
                </div>
                {comments.length ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 border-t py-3.5">
                      <Avatar>
                        <AvatarImage src={comment.avatar} alt="" />
                        <AvatarFallback className="text-xs">{comment.initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="text-sm font-semibold">{comment.author}</span>
                          <span className="text-xs text-muted-foreground">{comment.when}</span>
                        </div>
                        <p className="m-0 text-sm leading-normal text-pretty whitespace-pre-wrap">{comment.text}</p>
                      </div>
                      {canModerate && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Remover comentário"
                          title="Remover comentário"
                          className="size-8 rounded-[10px] text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => onRemoveComment(comment.id)}
                        >
                          <Trash2Icon className="size-3.75" />
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="m-0 border-t py-4 text-sm text-muted-foreground">Nenhum comentário publicado ainda.</p>
                )}
              </Card>
            </div>

            <div className="flex min-w-0 flex-col gap-4">
              <Card className="gap-4 rounded-2xl p-5">
                <h2 className={CARD_TITLE}>Período de votação</h2>
                <div className="flex flex-col gap-2">
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${elapsedPercent}%` }} />
                  </div>
                  <div className="flex justify-between text-[13px] text-muted-foreground">
                    <span>{startLabel}</span>
                    <span>{endLabel}</span>
                  </div>
                  <span className="text-sm font-semibold">{timeLabel}</span>
                </div>
                <dl className="m-0 flex flex-col border-t">
                  {meta.map((item) => (
                    <div key={item.label} className="flex justify-between gap-3 border-b py-3 text-sm">
                      <dt className="text-muted-foreground">{item.label}</dt>
                      <dd className="m-0 text-right font-semibold">{item.value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="flex gap-2.5 rounded-2xl bg-muted/60 px-3.5 py-3 text-[13px] leading-normal text-muted-foreground">
                  <InfoIcon className="mt-0.5 size-3.75 shrink-0" />
                  <span>Votos são anônimos. Exibimos apenas resultados agregados; cada CPF vota uma vez.</span>
                </div>
              </Card>

              <Card className="gap-3 rounded-2xl p-5">
                <h2 className={CARD_TITLE}>Histórico</h2>
                <ol className="m-0 flex list-none flex-col gap-3 p-0">
                  {history.map((item) => (
                    <li key={item.id} className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold">{item.label}</span>
                      <span className="text-[13px] text-muted-foreground">{item.detail}</span>
                    </li>
                  ))}
                </ol>
              </Card>
            </div>
          </div>
        </>
      )}

      <RejectCommentDialog {...removeDialog} />
    </section>
  )
}
