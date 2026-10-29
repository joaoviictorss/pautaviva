import { useCallback, useEffect, useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { differenceInCalendarDays, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { toast } from '@/components/ui/toast'
import { api } from '@/lib/api/client'
import { signOut } from '@/lib/auth/client'
import { roleLabel } from '@/lib/auth/roles'
import { getCategoryLook } from '@/lib/poll/categories'
import { POLL_STATUS, type PollStatus } from '@/lib/poll/status'
import type { PollPage } from '@/lib/poll/types'
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
  const navigate = useNavigate()
  const { session } = route.useRouteContext()
  const [signingOut, setSigningOut] = useState(false)
  const [openPolls, setOpenPolls] = useState<PainelPoll[]>([])
  const [scheduledPolls, setScheduledPolls] = useState<PainelPoll[]>([])
  const [summary, setSummary] = useState<ParticipationSummary>({ total: 0, resultsAvailable: 0, items: [] })
  const [loadingDashboard, setLoadingDashboard] = useState(true)
  const [dashboardError, setDashboardError] = useState<string>()
  const { user } = session
  const isCitizen = user.role === 'CITIZEN'

  const loadDashboard = useCallback(async () => {
    try {
      const [openPage, scheduledPage, participationSummary] = await Promise.all([
        api<PollPage>('/polls?status=OPEN&sort=ending&page=1&pageSize=3'),
        api<PollPage>('/polls?status=SCHEDULED&sort=start&page=1&pageSize=3'),
        isCitizen
          ? api<ParticipationSummary>('/participations/me')
          : Promise.resolve({ total: 0, resultsAvailable: 0, items: [] }),
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
  }, [isCitizen])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  async function handleSignOut() {
    setSigningOut(true)
    const { error } = await signOut()
    setSigningOut(false)

    if (error) {
      toast.add({ type: 'error', title: 'Não foi possível sair', description: 'Tente novamente em instantes.' })
      return
    }
    navigate({ to: '/entrar' })
  }

  const layoutProps: PainelLayoutProps = {
    name: user.name,
    firstName: user.name.split(' ')[0],
    initials: getInitials(user.name),
    email: user.email,
    image: user.image ?? undefined,
    roleLabel: roleLabel(user.role),
    isStaff: user.role === 'ADMIN' || user.role === 'MANAGER',
    isAdmin: user.role === 'ADMIN',
    isCitizen,
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
