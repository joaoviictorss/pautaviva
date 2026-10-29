import { useEffect, useState } from 'react'
import { startOfMonth } from 'date-fns'

import { api } from '@/lib/api/client'
import type { Poll } from '@/lib/poll/types'

import { Agenda as Layout } from './layout'
import type { AgendaLayoutProps, AgendaProps } from './data'

export function Agenda(_props: AgendaProps) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [selectedDay, setSelectedDay] = useState(() => new Date())
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const items = await api<Poll[]>(`/agenda?year=${month.getFullYear()}&month=${month.getMonth() + 1}`)
        if (active) {
          setPolls(items)
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

  const layoutProps: AgendaLayoutProps = {
    month,
    selectedDay,
    polls,
    loading,
    error,
    onMonthChange: (nextMonth) => {
      setLoading(true)
      setMonth(startOfMonth(nextMonth))
      setSelectedDay(startOfMonth(nextMonth))
    },
    onDaySelect: setSelectedDay,
  }

  return <Layout {...layoutProps} />
}
