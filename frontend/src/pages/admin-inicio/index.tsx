import { useEffect, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ListChecksIcon, MessageSquareWarningIcon, UsersIcon, VoteIcon } from 'lucide-react'

import type { Kpi } from '@/components/kpi-card'
import { useLiveRefresh } from '@/hooks/use-live-refresh'
import { useModerationQueue } from '@/hooks/use-moderation-queue'
import { api } from '@/lib/api/client'
import { toCategoryBars } from '@/lib/poll/categories'
import { toClosingRow, toUpcomingRow } from '@/lib/poll/rows'
import { getDefaultAvatar } from '@/lib/utils/avatar'
import { formatAge, formatNumber, getInitials, isOlderThanDay } from '@/lib/utils/format'
import type { ModerationComment } from '@/pages/moderacao/data'

import { AdminInicio as Layout } from './layout'
import type {
  AdminDashboard,
  AdminDashboardTotal,
  AdminInicioLayoutProps,
  AdminInicioPeriod,
  AdminInicioProps,
} from './data'

const route = getRouteApi('/_autenticado')

const PERIODS: AdminInicioPeriod[] = [7, 30, 90]
const COMPARISON_NOTE = 'vs. período anterior'
const MODERATION_ITEMS = 3

const shortDate = (date: Date) => format(date, 'dd MMM', { locale: ptBR }).replace('.', '')

function deltaOf({ current, previous }: AdminDashboardTotal, percent = true) {
  const difference = current - previous
  const value = percent && previous ? `${Math.round((difference / previous) * 100)}%` : formatNumber(difference)
  return {
    delta: difference > 0 ? `+${value}` : value,
    deltaTone: (difference > 0 ? 'up' : difference < 0 ? 'down' : 'neutral') as Kpi['deltaTone'],
  }
}

export function AdminInicio(_props: AdminInicioProps) {
  const { session } = route.useRouteContext()
  const { user } = session
  const [period, setPeriod] = useState<AdminInicioPeriod>(30)
  const [dashboard, setDashboard] = useState<AdminDashboard>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [refresh, setRefresh] = useState(0)
  const [rejecting, setRejecting] = useState<ModerationComment>()
  // o gestor vê os totais, mas a fila de moderação não é dele
  const canModerate = user.role !== 'MANAGER'
  const {
    comments: queue,
    processingIds,
    decide,
    error: moderationError,
  } = useModerationQueue(canModerate, () => setRefresh((current) => current + 1))

  useLiveRefresh(['poll-results', 'polls-changed', 'comments-changed'], () => setRefresh((current) => current + 1))

  useEffect(() => {
    let stale = false
    api<AdminDashboard>(`/dashboard?days=${period}`)
      .then((data) => {
        if (stale) return
        setDashboard(data)
        setError(undefined)
      })
      .catch((loadError: Error) => !stale && setError(loadError.message))
      .finally(() => !stale && setLoading(false))
    return () => {
      stale = true
    }
  }, [period, refresh])

  const days = (dashboard?.participationsByDay ?? []).map(({ day, count }) => ({ label: shortDate(parseISO(day)), count }))
  const peak = days.reduce((highest, day) => (day.count > highest.count ? day : highest), { label: '', count: 0 })
  const oldestFirst = [...queue].sort((a, b) => a.createdAt.localeCompare(b.createdAt))

  const layoutProps: AdminInicioLayoutProps = {
    firstName: user.name.split(' ')[0],
    loading,
    error: error ?? moderationError,
    periods: PERIODS,
    period,
    onPeriodChange: setPeriod,
    kpis: dashboard
      ? [
          {
            label: 'Pautas abertas',
            value: formatNumber(dashboard.openPolls.current),
            icon: ListChecksIcon,
            ...deltaOf(dashboard.openPolls, false),
            note: COMPARISON_NOTE,
          },
          {
            label: 'Participações',
            value: formatNumber(dashboard.participations.current),
            icon: VoteIcon,
            ...deltaOf(dashboard.participations),
            note: COMPARISON_NOTE,
          },
          {
            label: 'Cidadãos participantes',
            value: formatNumber(dashboard.citizens.current),
            icon: UsersIcon,
            ...deltaOf(dashboard.citizens),
            note: COMPARISON_NOTE,
          },
          {
            label: 'Comentários a moderar',
            value: formatNumber(dashboard.moderation.pending),
            icon: MessageSquareWarningIcon,
            delta: formatNumber(dashboard.moderation.overdue),
            deltaTone: 'warning',
            note: 'há mais de 24 h',
            to: canModerate ? '/admin/moderacao' : undefined,
          },
        ]
      : [],
    days,
    peakLabel: peak.count ? `Pico: ${formatNumber(peak.count)} em ${peak.label}` : undefined,
    categories: toCategoryBars(dashboard?.participationsByCategory ?? []),
    closing: (dashboard?.endingSoon ?? []).map(toClosingRow),
    upcoming: (dashboard?.upcoming ?? []).map(toUpcomingRow),
    moderation: canModerate
      ? {
          count: formatNumber(queue.length),
          items: oldestFirst.slice(0, MODERATION_ITEMS).map((comment) => ({
            id: comment.id,
            author: comment.author.name,
            avatar: comment.author.image ?? getDefaultAvatar(comment.author.name),
            initials: getInitials(comment.author.name),
            poll: comment.poll.title,
            age: formatAge(comment.createdAt),
            overdue: isOlderThanDay(comment.createdAt),
            text: comment.text,
            flag: comment.reports.length ? `Denunciado ${comment.reports.length}×` : undefined,
            keepLabel: comment.status === 'PENDING' ? 'Aprovar' : 'Manter',
            discardLabel: comment.status === 'PENDING' ? 'Rejeitar' : 'Remover',
            processing: processingIds.includes(comment.id),
          })),
          more: Math.max(0, queue.length - MODERATION_ITEMS),
          onKeep: (id) => void decide(queue.filter((comment) => comment.id === id), true),
          onDiscard: (id) => setRejecting(queue.find((comment) => comment.id === id)),
          rejectDialog: {
            count: rejecting ? 1 : 0,
            removing: rejecting?.status === 'APPROVED',
            flagged: !!rejecting?.reports.length,
            processing: processingIds.length > 0,
            onCancel: () => setRejecting(undefined),
            onConfirm: (reason) => {
              if (rejecting) void decide([rejecting], false, reason)
              setRejecting(undefined)
            },
          },
        }
      : undefined,
  }

  return <Layout {...layoutProps} />
}
