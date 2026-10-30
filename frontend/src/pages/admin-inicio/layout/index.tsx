import { Link } from '@tanstack/react-router'
import { CheckIcon, CircleAlertIcon, PencilIcon, XIcon } from 'lucide-react'

import { CategoryBars } from '@/components/category-bars'
import { KpiCard } from '@/components/kpi-card'
import { PageHeader } from '@/components/page-header'
import { ParticipationsChart } from '@/components/participations-chart'
import { ClosingRow, UpcomingRow } from '@/components/poll-rows'
import { RejectCommentDialog } from '@/components/reject-comment-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import type { AdminInicioLayoutProps } from '../data'

const SECTION_LINK = 'text-[13px] font-semibold text-primary no-underline hover:underline'

export function AdminInicio({
  firstName,
  loading,
  error,
  periods,
  period,
  onPeriodChange,
  kpis,
  days,
  peakLabel,
  categories,
  closing,
  upcoming,
  moderation,
}: AdminInicioLayoutProps) {
  return (
    <section className="flex animate-[word-in_.35s_cubic-bezier(.16,1,.3,1)] flex-col gap-6">
      <PageHeader title={`Olá, ${firstName}`} description={`Resumo da participação nos últimos ${period} dias`}>
        <div role="group" aria-label="Período" className="flex gap-1 rounded-full border bg-card p-1">
          {periods.map((option) => (
            <Button
              key={option}
              variant="ghost"
              size="sm"
              aria-pressed={option === period}
              onClick={() => onPeriodChange(option)}
              className={cn(
                'h-8 rounded-full px-3.5 text-[13px] font-semibold',
                option === period && 'bg-foreground text-background hover:bg-foreground/90 hover:text-background',
              )}
            >
              {option} dias
            </Button>
          ))}
        </div>
      </PageHeader>

      {error ? (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertDescription>{error}</AlertDescription>
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

          <div className="grid gap-4 min-[1180px]:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Card className="min-w-0 gap-4.5 rounded-2xl p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="m-0 text-[17px] font-bold tracking-tight">Participações por dia</h2>
                {peakLabel && <span className="text-[13px] text-muted-foreground">{peakLabel}</span>}
              </div>
              {peakLabel ? (
                <ParticipationsChart
                  days={days}
                  caption={`Participações por dia nos últimos ${period} dias`}
                  className="h-50 w-full"
                  highlightLast
                />
              ) : (
                <p className="m-0 text-sm text-muted-foreground">Nenhuma participação nos últimos {period} dias.</p>
              )}
            </Card>

            <Card className="min-w-0 gap-4 rounded-2xl p-5">
              <h2 className="m-0 text-[17px] font-bold tracking-tight">Participação por categoria</h2>
              <CategoryBars categories={categories} empty="Nenhuma participação no período." />
            </Card>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] gap-4">
            <Card className="min-w-0 gap-1.5 rounded-2xl px-5 pt-5 pb-2.5">
              <div className="flex items-baseline justify-between gap-2 pb-2">
                <h2 className="m-0 text-[17px] font-bold tracking-tight">Encerram em breve</h2>
                <Link to="/admin/pautas" search={{ status: 'OPEN' }} className={SECTION_LINK}>
                  Ver abertas
                </Link>
              </div>
              {closing.length ? (
                closing.map((poll) => <ClosingRow key={poll.id} poll={poll} to="/admin/pautas/$pollId" />)
              ) : (
                <p className="m-0 border-t py-3 text-sm text-muted-foreground">Nenhuma pauta aberta no momento.</p>
              )}
            </Card>

            <Card className="min-w-0 gap-1.5 rounded-2xl px-5 pt-5 pb-2.5">
              <div className="flex items-baseline justify-between gap-2 pb-2">
                <h2 className="m-0 text-[17px] font-bold tracking-tight">Próximas aberturas</h2>
                <Link to="/admin/pautas" search={{ nova: true }} className={SECTION_LINK}>
                  Nova pauta
                </Link>
              </div>
              {upcoming.length ? (
                upcoming.map((poll) => (
                  <UpcomingRow
                    key={poll.id}
                    poll={poll}
                    to="/admin/pautas/$pollId"
                    action={
                      <Button
                      variant="outline"
                      size="icon"
                      nativeButton={false}
                      aria-label={`Editar ${poll.title}`}
                      render={<Link to="/admin/pautas" search={{ editar: poll.id }} />}
                      className="relative z-10 size-8.5 rounded-xl"
                    >
                      <PencilIcon className="size-3.5" />
                    </Button>
                    }
                  />
                ))
              ) : (
                <p className="m-0 border-t py-3 text-sm text-muted-foreground">Nenhuma pauta agendada.</p>
              )}
            </Card>

            {moderation && (
              <Card className="min-w-0 gap-1.5 rounded-2xl px-5 pt-5 pb-2.5">
                <div className="flex items-center justify-between gap-2 pb-2">
                  <h2 className="m-0 flex items-center gap-2 text-[17px] font-bold tracking-tight">
                    Moderação
                    <span className="inline-flex h-5.5 min-w-5.5 items-center justify-center rounded-full bg-[oklch(0.95_0.05_75)] px-1.75 text-xs font-bold text-[oklch(0.45_0.11_70)]">
                      {moderation.count}
                    </span>
                  </h2>
                  <Link to="/admin/moderacao" className={SECTION_LINK}>
                    Ver fila
                  </Link>
                </div>
                {moderation.items.length ? (
                  moderation.items.map((item) => (
                    <div key={item.id} className="flex flex-col gap-2.5 border-t py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-7">
                          <AvatarImage src={item.avatar} alt="" />
                          <AvatarFallback className="text-xs">{item.initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex min-w-0 flex-1 flex-col gap-px">
                          <span className="text-[13px] font-semibold">{item.author}</span>
                          <span className="truncate text-xs text-muted-foreground">em {item.poll}</span>
                        </div>
                        <span
                          className={cn(
                            'text-xs whitespace-nowrap',
                            item.overdue ? 'font-semibold text-[oklch(0.5_0.13_70)]' : 'text-muted-foreground',
                          )}
                        >
                          {item.age}
                        </span>
                      </div>
                      <p className="m-0 line-clamp-2 text-sm leading-normal text-pretty">{item.text}</p>
                      {item.flag && (
                        <span className="inline-flex h-5.5 items-center self-start rounded-full bg-[oklch(0.96_0.03_23)] px-2 text-[11px] font-semibold text-[oklch(0.5_0.17_23)]">
                          {item.flag}
                        </span>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={item.processing}
                          onClick={() => moderation.onKeep(item.id)}
                          className="h-8 rounded-[10px] border-foreground bg-foreground px-3 text-xs font-semibold text-background hover:bg-foreground/85 hover:text-background"
                        >
                          <CheckIcon />
                          {item.keepLabel}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={item.processing}
                          onClick={() => moderation.onDiscard(item.id)}
                          className="h-8 rounded-[10px] px-3 text-xs font-semibold"
                        >
                          <XIcon />
                          {item.discardLabel}
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="m-0 border-t py-4 text-sm text-muted-foreground">Tudo em dia. Nenhum comentário aguardando.</p>
                )}
                {moderation.more > 0 && (
                  <Link to="/admin/moderacao" className="border-t pt-2.5 pb-1.5 text-[13px] text-muted-foreground no-underline hover:underline">
                    + {moderation.more} na fila
                  </Link>
                )}
                <RejectCommentDialog {...moderation.rejectDialog} />
              </Card>
            )}
          </div>
        </>
      )}
    </section>
  )
}
