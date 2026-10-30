import { Link } from '@tanstack/react-router'
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

import { CommunityNavigation } from '@/components/community-navigation'
import { SiteHeader } from '@/components/site-header'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { POLL_STATUS } from '@/lib/poll/status'

import type { AgendaLayoutProps } from '../data'

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

export function Agenda({
  month,
  selectedDay,
  polls,
  loading,
  error,
  onMonthChange,
  onDaySelect,
}: AgendaLayoutProps) {
  const days = []
  const firstDay = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
  const lastDay = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
  for (let day = firstDay; day <= lastDay; day = addDays(day, 1)) days.push(day)

  const eventsForDay = (day: Date) =>
    polls.filter((poll) => isSameDay(new Date(poll.startsAt), day))
  const selectedEvents = eventsForDay(selectedDay)

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <CommunityNavigation active="agenda">
        <header className="flex flex-col gap-2">
          <h1 className="m-0 text-3xl font-bold tracking-tight">Agenda</h1>
          <p className="m-0 text-muted-foreground">Acompanhe as datas de início das pautas da comunidade.</p>
        </header>

        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,.7fr)]">
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle className="capitalize">{format(month, 'MMMM yyyy', { locale: ptBR })}</CardTitle>
                <CardDescription>Selecione um dia para ver as pautas previstas.</CardDescription>
              </div>
              <div className="flex gap-1">
                <Button aria-label="Mês anterior" variant="outline" size="icon" onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
                  <ChevronLeftIcon />
                </Button>
                <Button aria-label="Próximo mês" variant="outline" size="icon" onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
                  <ChevronRightIcon />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-center">
                {WEEKDAYS.map((weekday) => (
                  <div key={weekday} className="py-2 text-xs font-medium text-muted-foreground">{weekday}</div>
                ))}
                {days.map((day) => {
                  const dayEvents = eventsForDay(day)
                  const isSelected = isSameDay(day, selectedDay)
                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      aria-label={`${format(day, "d 'de' MMMM", { locale: ptBR })}${dayEvents.length ? `, ${dayEvents.length} ${dayEvents.length === 1 ? 'pauta' : 'pautas'}` : ''}`}
                      aria-pressed={isSelected}
                      disabled={!isSameMonth(day, month)}
                      onClick={() => onDaySelect(day)}
                      className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-sm transition-colors disabled:cursor-default disabled:text-muted-foreground/35 ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                    >
                      <span>{format(day, 'd')}</span>
                      {dayEvents.length > 0 && (
                        <span className={`size-1.5 rounded-full ${isSelected ? 'bg-primary-foreground' : 'bg-primary'}`} />
                      )}
                    </button>
                  )
                })}
              </div>
              {loading && <Skeleton className="mt-4 h-10 w-full" />}
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>{format(selectedDay, "d 'de' MMMM", { locale: ptBR })}</CardTitle>
              <CardDescription>{selectedEvents.length} {selectedEvents.length === 1 ? 'pauta' : 'pautas'} com início nesta data</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {loading ? (
                <Skeleton className="h-24 w-full" />
              ) : selectedEvents.length ? (
                selectedEvents.map((poll) => (
                  <div key={poll.id} className="flex flex-col gap-2 rounded-xl border p-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{poll.category.name}</Badge>
                      <Badge className={POLL_STATUS[poll.status].className}>{POLL_STATUS[poll.status].label}</Badge>
                    </div>
                    <h3 className="m-0 font-semibold">{poll.title}</h3>
                    <p className="m-0 text-sm text-muted-foreground">{format(new Date(poll.startsAt), 'HH:mm')}</p>
                    <Button nativeButton={false} render={<Link to="/pautas/$pollId" params={{ pollId: poll.id }} />} variant="link" className="h-auto w-fit px-0">
                      Ver pauta
                      <ChevronRightIcon />
                    </Button>
                  </div>
                ))
              ) : (
                <Empty className="rounded-xl border border-dashed py-6">
                  <EmptyHeader>
                    <EmptyMedia variant="icon"><CalendarDaysIcon /></EmptyMedia>
                    <EmptyTitle>Nenhuma pauta neste dia</EmptyTitle>
                    <EmptyDescription>Escolha outra data no calendário para consultar a agenda.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>
        </div>
      </CommunityNavigation>
    </div>
  )
}
