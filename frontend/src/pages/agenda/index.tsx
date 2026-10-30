import { useEffect, useState } from 'react'
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  isTomorrow,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { api } from '@/lib/api/client'
import { useSession } from '@/lib/auth/client'
import { COMMENT_STATUS } from '@/lib/poll/status'
import type { Poll } from '@/lib/poll/types'

import { Agenda as Layout } from './layout'
import type { AgendaDay, AgendaEvent, AgendaGroup, AgendaLayoutProps, AgendaProps } from './data'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const DAY_EVENTS = 2
const UPCOMING_EVENTS = 8

interface DatedEvent extends AgendaEvent {
  date: Date
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

export function Agenda(_props: AgendaProps) {
  const { data: session } = useSession()
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [selectedDay, setSelectedDay] = useState<Date>()
  const [polls, setPolls] = useState<Poll[]>([])
  const [upcoming, setUpcoming] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const citizen = session?.user.role === 'CITIZEN'

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const [items, next] = await Promise.all([
          api<Poll[]>(`/agenda?year=${month.getFullYear()}&month=${month.getMonth() + 1}`),
          api<Poll[]>('/agenda/upcoming'),
        ])
        if (active) {
          setPolls(items)
          setUpcoming(next)
          setError(undefined)
        }
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar a agenda.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [month])

  function toEvents(poll: Poll): DatedEvent[] {
    const today = startOfDay(new Date())
    const event = (kind: 'open' | 'close'): DatedEvent => {
      const date = new Date(kind === 'open' ? poll.startsAt : poll.endsAt)
      const past = isBefore(date, today)
      const opening = kind === 'open'
      const showVote = citizen && !opening && poll.status === 'OPEN'
      return {
        key: `${poll.id}-${kind}`,
        date,
        pollId: poll.id,
        title: poll.title,
        category: poll.category.name,
        kindLabel: opening ? (past ? 'Abriu' : 'Abre') : past ? 'Encerrou' : 'Encerra',
        time: format(date, 'HH:mm'),
        tone: past ? 'past' : kind,
        badge: showVote
          ? poll.hasVoted
            ? { label: 'Você votou', className: COMMENT_STATUS.APPROVED.className }
            : { label: 'Falta seu voto', className: COMMENT_STATUS.PENDING.className }
          : undefined,
      }
    }
    return [event('open'), event('close')]
  }

  const events = polls.flatMap(toEvents)
  const eventsOn = (day: Date) => events.filter(({ date }) => isSameDay(date, day))

  const days: AgendaDay[] = []
  const lastDay = endOfWeek(endOfMonth(month))
  for (let date = startOfWeek(month); date <= lastDay; date = addDays(date, 1)) {
    const dayEvents = eventsOn(date)
    days.push({
      key: date.toISOString(),
      date,
      label: format(date, 'd'),
      ariaLabel: `${format(date, "d 'de' MMMM", { locale: ptBR })}: ${dayEvents.length} ${dayEvents.length === 1 ? 'evento' : 'eventos'}`,
      inMonth: isSameMonth(date, month),
      today: isToday(date),
      selected: !!selectedDay && isSameDay(date, selectedDay),
      events: dayEvents.slice(0, DAY_EVENTS),
    })
  }

  const dayLabel = (date: Date) =>
    isToday(date) ? 'Hoje' : isTomorrow(date) ? 'Amanhã' : capitalize(format(date, "EEEE, dd 'de' MMM", { locale: ptBR }).replace('.', ''))

  const groups: AgendaGroup[] = []
  if (selectedDay) {
    const dayEvents = eventsOn(selectedDay)
    if (dayEvents.length) groups.push({ label: '', events: dayEvents })
  } else {
    const today = startOfDay(new Date())
    const next = upcoming
      .flatMap(toEvents)
      .filter(({ date }) => !isBefore(date, today))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, UPCOMING_EVENTS)
    for (const event of next) {
      const label = dayLabel(event.date)
      const group = groups.at(-1)
      if (group?.label === label) group.events.push(event)
      else groups.push({ label, events: [event] })
    }
  }

  const changeMonth = (nextMonth: Date) => {
    setLoading(true)
    setSelectedDay(undefined)
    setMonth(startOfMonth(nextMonth))
  }

  const layoutProps: AgendaLayoutProps = {
    monthLabel: capitalize(format(month, 'MMMM yyyy', { locale: ptBR })),
    weekdays: WEEKDAYS,
    days,
    listTitle: selectedDay ? capitalize(format(selectedDay, "EEEE, dd 'de' MMMM", { locale: ptBR })) : 'Próximos eventos',
    groups,
    hasSelectedDay: !!selectedDay,
    loading,
    error,
    onPreviousMonth: () => changeMonth(addMonths(month, -1)),
    onNextMonth: () => changeMonth(addMonths(month, 1)),
    onToday: () => {
      const today = new Date()
      if (!isSameMonth(today, month)) changeMonth(today)
      setSelectedDay(startOfDay(today))
    },
    onDaySelect: ({ date, selected }) => setSelectedDay(selected ? undefined : date),
    onClearDay: () => setSelectedDay(undefined),
  }

  return <Layout {...layoutProps} />
}
