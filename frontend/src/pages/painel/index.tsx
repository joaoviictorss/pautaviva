import { useCallback, useEffect, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { differenceInCalendarDays, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { useSignOut } from '@/hooks/use-sign-out'
import { api } from '@/lib/api/client'
import { roleLabel } from '@/lib/auth/roles'
import { getCategoryLook } from '@/lib/poll/categories'
import { POLL_STATUS, type PollStatus } from '@/lib/poll/status'
import type { PollPage } from '@/lib/poll/types'
import { getDefaultAvatar } from '@/lib/utils/avatar'
import { getInitials } from '@/lib/utils/format'

import { Painel as Layout } from './layout'
import type { PainelLayoutProps, PainelProps, ParticipationSummary, ParticipationItem, PainelPoll } from './data'

const route = getRouteApi('/_autenticado')

function getDateLabel(status: PollStatus, date: string) {
  if (status === 'CLOSED') return 'Votação encerrada'
  const days = differenceInCalendarDays(new Date(date), new Date())
  if (status === 'OPEN') {
    if (days <= 0) return 'Encerra hoje'
    if (days === 1) return 'Encerra amanhã'
    return `Encerra em ${days} dias`
  }
  if (days <= 0) return 'Abre hoje'
  if (days === 1) return 'Abre amanhã'
  return `Abre em ${days} dias`
}

function toDashboardPoll(poll: PollPage['items'][number]): PainelPoll {
  return {
    poll,
    statusLabel: POLL_STATUS[poll.status].label,
    statusClassName: POLL_STATUS[poll.status].className,
    categoryLook: getCategoryLook(poll.category.name),
    dateLabel: getDateLabel(poll.status, poll.status === 'OPEN' ? poll.endsAt : poll.startsAt),
  }
}

export function Painel(_props: PainelProps) {
  const { session } = route.useRouteContext()
  const { signingOut, handleSignOut } = useSignOut()
  const [openPolls, setOpenPolls] = useState<PainelPoll[]>([])
  const [scheduledPolls, setScheduledPolls] = useState<PainelPoll[]>([])
  const [summary, setSummary] = useState<ParticipationSummary>({ total: 0, resultsAvailable: 0, items: [] })
  const [loadingDashboard, setLoadingDashboard] = useState(true)
  const [dashboardError, setDashboardError] = useState<string>()
  const { user } = session

  const loadDashboard = useCallback(async () => {
    try {
      const [openPage, scheduledPage, participationSummary] = await Promise.all([
        api<PollPage>('/polls?status=OPEN&sort=ending&page=1&pageSize=3'),
        api<PollPage>('/polls?status=SCHEDULED&sort=start&page=1&pageSize=3'),
        api<ParticipationSummary>('/participations/me'),
      ])
      setOpenPolls(openPage.items.map(toDashboardPoll))
      setScheduledPolls(scheduledPage.items.map(toDashboardPoll))
      setSummary(participationSummary)
      setDashboardError(undefined)
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : 'Não foi possível carregar o resumo do painel.')
    } finally {
      setLoadingDashboard(false)
    }
  }, [])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  const layoutProps: PainelLayoutProps = {
    name: user.name,
    firstName: user.name.split(' ')[0],
    initials: getInitials(user.name),
    email: user.email,
    image: user.image ?? getDefaultAvatar(user.name),
    roleLabel: roleLabel(user.role),
    signingOut,
    onSignOut: handleSignOut,
    openPolls,
    scheduledPolls,
    participationCount: summary.total,
    resultsAvailableCount: summary.resultsAvailable,
    recentParticipations: summary.items.map((item): ParticipationItem => ({
      ...toDashboardPoll(item.poll),
      participatedAtLabel: format(new Date(item.participatedAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
      resultsAvailable: item.resultsAvailable,
    })),
    loadingDashboard,
    dashboardError,
    onRetry: () => void loadDashboard(),
  }

  return <Layout {...layoutProps} />
}
