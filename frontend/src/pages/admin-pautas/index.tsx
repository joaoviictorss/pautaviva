import { useCallback, useEffect, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { differenceInCalendarDays, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { api } from '@/lib/api/client'
import { getCategoryLook } from '@/lib/poll/categories'
import { POLL_STATUS } from '@/lib/poll/status'
import { VOTE_OPTIONS } from '@/lib/poll/votes'
import { formatNumber } from '@/lib/utils/format'

import { AdminPautas as Layout } from './layout'
import type { Category, Poll } from '@/lib/poll/types'

import type { AdminPautasLayoutProps, AdminPautasProps, PollCardView, StatusFilter } from './data'

const route = getRouteApi('/_autenticado/admin/pautas')

const FILTERS: [StatusFilter, string][] = [
  ['ALL', 'Todas'],
  ['OPEN', 'Abertas'],
  ['SCHEDULED', 'Agendadas'],
  ['CLOSED', 'Encerradas'],
]

const shortDate = (iso: string) => format(new Date(iso), 'dd MMM', { locale: ptBR }).replace('.', '')

function toCard(poll: Poll, onEdit: (poll: Poll) => void): PollCardView {
  const { FOR, AGAINST, ABSTAIN } = poll.results
  const totalVotes = FOR + AGAINST + ABSTAIN
  const percents = [FOR, AGAINST, ABSTAIN].map((votes) => (totalVotes ? Math.round((votes / totalVotes) * 100) : 0))
  const daysLeft = differenceInCalendarDays(new Date(poll.endsAt), new Date())
  const daysUntil = differenceInCalendarDays(new Date(poll.startsAt), new Date())

  return {
    id: poll.id,
    title: poll.title,
    description: poll.description,
    categoryName: poll.category.name,
    categoryLook: getCategoryLook(poll.category.name),
    statusLabel: POLL_STATUS[poll.status].label,
    statusClassName: POLL_STATUS[poll.status].className,
    bar: totalVotes
      ? {
          segments: VOTE_OPTIONS.map(({ key, color }, i) => ({ key, color, percent: percents[i] })),
          label: `${percents[0]}% a favor, ${percents[1]}% contra, ${percents[2]}% abstenção`,
          forLabel: `${percents[0]}% a favor`,
        }
      : undefined,
    participationsLabel:
      poll.status === 'SCHEDULED' ? undefined : `${formatNumber(poll.participations)} participações`,
    scheduleLabel:
      poll.status === 'SCHEDULED'
        ? `${daysUntil <= 1 ? 'Abre amanhã' : `Abre em ${shortDate(poll.startsAt)}`} · até ${shortDate(poll.endsAt)}`
        : undefined,
    timeLabel:
      poll.status === 'OPEN'
        ? daysLeft <= 0
          ? 'Encerra hoje'
          : daysLeft === 1
            ? '1 dia restante'
            : `${daysLeft} dias restantes`
        : undefined,
    onEdit: poll.status === 'SCHEDULED' ? () => onEdit(poll) : undefined,
  }
}

export function AdminPautas(_props: AdminPautasProps) {
  const { q = '' } = route.useSearch()
  const [polls, setPolls] = useState<Poll[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [drawer, setDrawer] = useState<{ open: boolean; poll?: Poll }>({ open: false })

  const load = useCallback(async () => {
    try {
      const [pollList, categoryList] = await Promise.all([
        api<Poll[]>('/polls'),
        api<Category[]>('/categories'),
      ])
      setPolls(pollList)
      setCategories(categoryList)
      setError(undefined)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const term = q.trim().toLowerCase()
  const matching = polls.filter(
    (poll) => !term || poll.title.toLowerCase().includes(term) || poll.category.name.toLowerCase().includes(term)
  )
  const openEdit = (poll: Poll) => setDrawer({ open: true, poll })

  const layoutProps: AdminPautasLayoutProps = {
    filters: FILTERS.map(([value, label]) => ({
      value,
      label,
      count: matching.filter((poll) => value === 'ALL' || poll.status === value).length,
    })),
    statusFilter,
    onStatusFilterChange: setStatusFilter,
    cards: matching
      .filter((poll) => statusFilter === 'ALL' || poll.status === statusFilter)
      .map((poll) => toCard(poll, openEdit)),
    loading,
    error,
    onNew: () => setDrawer({ open: true }),
    drawer: { ...drawer, categories },
    onDrawerOpenChange: (open) => setDrawer((current) => ({ ...current, open })),
    onSaved: () => {
      setDrawer({ open: false })
      setStatusFilter('ALL')
      load()
    },
  }

  return <Layout {...layoutProps} />
}
