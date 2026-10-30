import { Link } from '@tanstack/react-router'
import { ChevronLeftIcon, ChevronRightIcon, CircleAlertIcon } from 'lucide-react'

import { PageHeader } from '@/components/page-header'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import type { AgendaEvent, AgendaLayoutProps } from '../data'

const CARD_TITLE = 'm-0 text-[17px] font-bold tracking-tight'
const TONES: Record<AgendaEvent['tone'], { dot: string; text: string }> = {
  open: { dot: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-300' },
  close: { dot: 'bg-primary', text: 'text-primary' },
  past: { dot: 'bg-muted-foreground/40', text: 'text-muted-foreground' },
}

export function Agenda({
  monthLabel,
  weekdays,
  days,
  listTitle,
  groups,
  hasSelectedDay,
  loading,
  error,
  onPreviousMonth,
  onNextMonth,
  onToday,
  onDaySelect,
  onClearDay,
}: AgendaLayoutProps) {
  return (
    <section className="flex animate-[word-in_.35s_cubic-bezier(.16,1,.3,1)] flex-col gap-6">
      <PageHeader title="Agenda" description="Quando cada votação abre e encerra. Pautas agendadas abrem sozinhas na data marcada." />

      {error && (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid items-start gap-4 min-[1100px]:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="min-w-0 gap-4 rounded-2xl p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className={CARD_TITLE}>{monthLabel}</h2>
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" className="h-8.5 rounded-xl" onClick={onToday}>Hoje</Button>
              <Button aria-label="Mês anterior" variant="outline" size="icon" className="size-8.5 rounded-xl" onClick={onPreviousMonth}>
                <ChevronLeftIcon />
              </Button>
              <Button aria-label="Próximo mês" variant="outline" size="icon" className="size-8.5 rounded-xl" onClick={onNextMonth}>
                <ChevronRightIcon />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {weekdays.map((weekday) => (
              <span key={weekday} className="pb-1.5 text-center font-mono text-[11px] text-muted-foreground uppercase">{weekday}</span>
            ))}
            {days.map((day) => (
              <button
                key={day.key}
                type="button"
                aria-label={day.ariaLabel}
                aria-pressed={day.selected}
                onClick={() => onDaySelect(day)}
                className={cn(
                  'flex min-h-13 min-w-0 cursor-pointer flex-col gap-1 rounded-xl border-[1.5px] p-1.5 text-left transition-colors hover:bg-muted/60 min-[700px]:min-h-21',
                  day.selected ? 'border-primary bg-accent/60' : 'border-border/60 bg-card',
                  !day.inMonth && 'opacity-40',
                )}
              >
                <span
                  className={cn(
                    'grid h-6 min-w-6 place-items-center self-start rounded-full px-1 text-[13px] font-medium',
                    day.today && 'bg-primary font-bold text-primary-foreground',
                  )}
                >
                  {day.label}
                </span>
                {day.events.map((event) => (
                  <span key={event.key} className={cn('flex min-w-0 items-center gap-1 text-[11px] font-semibold', TONES[event.tone].text)}>
                    <span className={cn('size-1.5 shrink-0 rounded-full', TONES[event.tone].dot)} />
                    <span className="hidden truncate min-[700px]:inline">{event.title}</span>
                  </span>
                ))}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><span className={cn('size-2 rounded-full', TONES.open.dot)} />Abre votação</span>
            <span className="inline-flex items-center gap-1.5"><span className={cn('size-2 rounded-full', TONES.close.dot)} />Encerra votação</span>
          </div>
        </Card>

        <Card className="min-w-0 gap-1.5 rounded-2xl px-5 pt-5 pb-2">
          <div className="flex items-center justify-between gap-2 pb-2">
            <h2 className={CARD_TITLE}>{listTitle}</h2>
            {hasSelectedDay && (
              <button type="button" onClick={onClearDay} className="cursor-pointer text-[13px] font-semibold whitespace-nowrap text-primary hover:underline">
                Ver próximos
              </button>
            )}
          </div>
          {loading ? (
            <Skeleton className="mb-3 h-40 rounded-xl" />
          ) : groups.length ? (
            groups.map((group) => (
              <div key={group.label} className="flex flex-col gap-0.5 border-t py-3">
                {group.label && <span className="pb-1 text-xs font-semibold text-muted-foreground">{group.label}</span>}
                {group.events.map((event) => (
                  <Link
                    key={event.key}
                    to="/pautas/$pollId"
                    params={{ pollId: event.pollId }}
                    className="-mx-2 flex items-center gap-3 rounded-xl p-2 text-inherit no-underline hover:bg-muted/60 hover:no-underline"
                  >
                    <span className={cn('w-1 shrink-0 self-stretch rounded-full', TONES[event.tone].dot)} />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-sm font-semibold">{event.title}</span>
                      <span className="text-xs text-muted-foreground">
                        <span className={cn('font-semibold', TONES[event.tone].text)}>{event.kindLabel}</span> · {event.time} · {event.category}
                      </span>
                    </span>
                    {event.badge && <Badge className={cn('h-5.5 px-2 text-[11px] font-semibold', event.badge.className)}>{event.badge.label}</Badge>}
                  </Link>
                ))}
              </div>
            ))
          ) : (
            <p className="m-0 border-t py-4 text-sm text-muted-foreground">
              {hasSelectedDay ? 'Nenhuma votação abre ou encerra neste dia.' : 'Nenhuma votação prevista.'}
            </p>
          )}
        </Card>
      </div>
    </section>
  )
}
