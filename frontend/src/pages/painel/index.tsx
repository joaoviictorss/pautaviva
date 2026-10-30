import { useCallback, useEffect, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { format, isSameMonth, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CheckCheckIcon, CircleCheckIcon, HourglassIcon, MessageCircleIcon } from 'lucide-react'

import { api } from '@/lib/api/client'
import { getCategoryLook, toCategoryBars } from '@/lib/poll/categories'
import { COMMENT_STATUS, getPollTimeLabel } from '@/lib/poll/status'
import type { CitizenSummary, MyComment, Poll, VoteOption } from '@/lib/poll/types'
import { formatNumber } from '@/lib/utils/format'

import { Painel as Layout } from './layout'
import type { PainelLayoutProps, PainelProps } from './data'

const route = getRouteApi('/_comunidade/_autenticado')

const RECENT_COMMENTS = 3
const CHART_MONTHS = 6
const TOP_CATEGORIES = 5

interface Dashboard {
  summary: CitizenSummary
  comments: MyComment[]
}

export function Painel(_props: PainelProps) {
  const { session } = route.useRouteContext()
  const [dashboard, setDashboard] = useState<Dashboard>()
  const [voting, setVoting] = useState<{ poll: Poll; option: VoteOption }>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  const load = useCallback(async () => {
    try {
      const [summary, comments] = await Promise.all([
        api<CitizenSummary>('/participations/me/summary'),
        api<MyComment[]>('/comments/me'),
      ])
      setDashboard({ summary, comments })
      setError(undefined)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar o resumo do painel.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const summary = dashboard?.summary
  const activity = summary?.activity ?? []
  const now = new Date()
  const categoryCounts = new Map<string, number>()
  for (const { category } of activity) categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1)

  const layoutProps: PainelLayoutProps = {
    firstName: session.user.name.split(' ')[0],
    kpis: dashboard && summary
      ? [
          {
            label: 'Votos registrados',
            value: formatNumber(summary.total),
            icon: CheckCheckIcon,
            note: 'pautas em que participou',
            to: '/minha-participacao',
          },
          {
            label: 'Aguardando seu voto',
            value: formatNumber(summary.pendingTotal),
            icon: HourglassIcon,
            note: 'pautas abertas',
          },
          {
            label: 'Comentários',
            value: formatNumber(dashboard.comments.length),
            icon: MessageCircleIcon,
            note: 'enviados por você',
          },
          {
            label: 'Pautas aprovadas',
            value: formatNumber(summary.approved),
            icon: CircleCheckIcon,
            note: 'entre as que você votou',
          },
        ]
      : [],
    pendingTotal: summary?.pendingTotal ?? 0,
    pending: (summary?.pending ?? []).map((poll) => ({
      poll,
      categoryLook: getCategoryLook(poll.category.name),
      timeLabel: getPollTimeLabel(poll),
    })),
    comments: (dashboard?.comments ?? []).slice(0, RECENT_COMMENTS).map(({ id, poll, text, status }) => ({
      id,
      pollId: poll.id,
      pollTitle: poll.title,
      text,
      statusLabel: COMMENT_STATUS[status].label,
      statusClassName: COMMENT_STATUS[status].className,
    })),
    months: Array.from({ length: CHART_MONTHS }, (_, index) => {
      const month = subMonths(now, CHART_MONTHS - 1 - index)
      return {
        label: format(month, 'MMM', { locale: ptBR }).replace('.', ''),
        count: activity.filter(({ participatedAt }) => isSameMonth(new Date(participatedAt), month)).length,
      }
    }),
    categories: toCategoryBars(
      [...categoryCounts]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, TOP_CATEGORIES),
    ),
    results: summary?.results ?? [],
    voting,
    loading,
    error,
    onRetry: () => void load(),
    onVote: (poll, option) => setVoting({ poll, option }),
    onCloseVote: () => setVoting(undefined),
    onVoted: () => void load(),
  }

  return <Layout {...layoutProps} />
}
