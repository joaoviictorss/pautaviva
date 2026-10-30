import { useCallback, useEffect, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { toast } from '@/components/ui/toast'
import { usePollExport } from '@/hooks/use-poll-export'
import { usePollLive, type PollLiveUpdate } from '@/hooks/use-poll-live'
import { api } from '@/lib/api/client'
import { getCategoryLook } from '@/lib/poll/categories'
import { POLL_STATUS } from '@/lib/poll/status'
import type { PollStats } from '@/lib/poll/types'
import { getBars } from '@/lib/poll/votes'
import { getDefaultAvatar } from '@/lib/utils/avatar'
import { formatNumber, getInitials } from '@/lib/utils/format'

import { AdminPauta as Layout } from './layout'
import type { AdminPautaComment, AdminPautaLayoutProps, AdminPautaProps } from './data'

const route = getRouteApi('/_autenticado/admin/pautas_/$pollId')
const sessionRoute = getRouteApi('/_autenticado')

const HISTORY_LABELS: Record<string, string> = {
  POLL_CREATED: 'Pauta cadastrada',
  POLL_UPDATED: 'Pauta editada',
  POLL_CLOSED_AUTOMATICALLY: 'Votação encerrada automaticamente',
}

const dateTime = (iso: string) => format(new Date(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
const shortDate = (date: Date) => format(date, 'dd MMM', { locale: ptBR }).replace('.', '')
const daysLabel = (days: number) => `${days} ${days === 1 ? 'dia' : 'dias'}`

function timeLabel(poll: PollStats) {
  if (poll.status === 'CLOSED') return 'Votação encerrada'
  if (poll.status === 'SCHEDULED') {
    return `Abre em ${daysLabel(differenceInCalendarDays(new Date(poll.startsAt), new Date()))}`
  }
  const left = differenceInCalendarDays(new Date(poll.endsAt), new Date())
  return left <= 0 ? 'Encerra hoje' : `Encerra em ${daysLabel(left)}`
}

function elapsedPercent(poll: PollStats) {
  if (poll.status === 'CLOSED') return 100
  if (poll.status === 'SCHEDULED') return 0
  const start = new Date(poll.startsAt).getTime()
  return Math.min(100, Math.round(((Date.now() - start) / (new Date(poll.endsAt).getTime() - start)) * 100))
}

export function AdminPauta(_props: AdminPautaProps) {
  const { pollId } = route.useParams()
  const { session } = sessionRoute.useRouteContext()
  const [poll, setPoll] = useState<PollStats>()
  const [comments, setComments] = useState<AdminPautaComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [removingId, setRemovingId] = useState<string>()
  const [processing, setProcessing] = useState(false)
  const { exportingFormat, exportError, exportResults } = usePollExport(pollId)

  const load = useCallback(async () => {
    try {
      const [stats, published] = await Promise.all([
        api<PollStats>(`/polls/${encodeURIComponent(pollId)}/stats`),
        api<AdminPautaComment[]>(`/polls/${encodeURIComponent(pollId)}/comments`),
      ])
      setPoll(stats)
      setComments(published)
      setError(undefined)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar a pauta.')
    } finally {
      setLoading(false)
    }
  }, [pollId])

  const applyResults = useCallback((update: PollLiveUpdate) => {
    setPoll((current) => (current ? { ...current, ...update } : current))
  }, [])

  const sync = useCallback(() => void load(), [load])
  const live = usePollLive(pollId, sync, applyResults)

  useEffect(() => {
    sync()
  }, [sync])

  async function handleRemove(reason: string) {
    setProcessing(true)
    try {
      await api(`/moderation/comments/${encodeURIComponent(removingId ?? '')}`, {
        method: 'PATCH',
        json: { action: 'REMOVE', reason },
      })
    } catch (removeError) {
      toast.add({
        type: 'error',
        title: 'Não foi possível remover o comentário',
        description: removeError instanceof Error ? removeError.message : undefined,
      })
    }
    setRemovingId(undefined)
    setProcessing(false)
    await load()
  }

  const days = (poll?.participationsByDay ?? []).map(({ day, count }) => ({
    label: shortDate(parseISO(day)),
    count,
  }))
  const peak = days.reduce((highest, day) => (day.count > highest.count ? day : highest), { label: '', count: 0 })
  const totalVotes = poll ? poll.results.FOR + poll.results.AGAINST + poll.results.ABSTAIN : 0
  const bars =
    poll && totalVotes ? getBars({ f: poll.results.FOR, c: poll.results.AGAINST, a: poll.results.ABSTAIN }) : undefined
  const pendingCount = poll ? poll.comments.PENDING + poll.pendingReports : 0

  const layoutProps: AdminPautaLayoutProps = {
    poll,
    loading,
    error,
    live,
    bars,
    barLabel: bars?.map((bar) => `${bar.percentLabel} ${bar.label.toLowerCase()}`).join(', '),
    days,
    peakLabel: peak.count ? `Pico: ${formatNumber(peak.count)} em ${peak.label}` : undefined,
    comments: comments.map((comment) => ({
      id: comment.id,
      author: comment.author.name,
      avatar: comment.author.image ?? getDefaultAvatar(comment.author.name),
      initials: getInitials(comment.author.name),
      when: dateTime(comment.createdAt),
      text: comment.text,
    })),
    pendingLabel: pendingCount ? `${formatNumber(pendingCount)} aguardando moderação` : undefined,
    // o gestor acompanha a pauta, mas a fila de moderação não é dele
    canModerate: session.user.role !== 'MANAGER',
    onRemoveComment: setRemovingId,
    elapsedPercent: poll ? elapsedPercent(poll) : 0,
    meta: poll
      ? [
          { label: 'Duração', value: daysLabel(differenceInCalendarDays(new Date(poll.endsAt), new Date(poll.startsAt))) },
          { label: 'Participações', value: formatNumber(poll.participations) },
          { label: 'Comentários rejeitados', value: formatNumber(poll.comments.REJECTED) },
          { label: 'Comentários removidos', value: formatNumber(poll.comments.REMOVED) },
          { label: 'Criada por', value: poll.createdBy },
          { label: 'Criada em', value: format(new Date(poll.createdAt), 'dd/MM/yyyy') },
        ]
      : [],
    history: (poll?.history ?? []).map((entry) => ({
      id: entry.id,
      label: HISTORY_LABELS[entry.action] ?? entry.action,
      detail: `${entry.actorName ?? 'Sistema'} · ${dateTime(entry.createdAt)}`,
    })),
    exportingFormat,
    exportError,
    onExport: (exportFormat) => void exportResults(exportFormat),
    removeDialog: {
      count: removingId ? 1 : 0,
      removing: true,
      flagged: true,
      processing,
      onCancel: () => setRemovingId(undefined),
      onConfirm: (reason) => void handleRemove(reason),
    },
    ...(poll && {
      categoryLook: getCategoryLook(poll.category.name),
      statusLabel: POLL_STATUS[poll.status].label,
      statusClassName: POLL_STATUS[poll.status].className,
      participationsLabel: `${formatNumber(poll.participations)} ${poll.participations === 1 ? 'participação' : 'participações'}`,
      resultNote:
        poll.status === 'CLOSED'
          ? `Votação encerrada em ${shortDate(new Date(poll.endsAt))}. Resultado consolidado.`
          : 'Atualizado em tempo real. Pode mudar até o encerramento.',
      emptyResultLabel:
        poll.status === 'SCHEDULED' ? `A votação abre em ${shortDate(new Date(poll.startsAt))}` : 'Ainda sem votos',
      startLabel: shortDate(new Date(poll.startsAt)),
      endLabel: shortDate(new Date(poll.endsAt)),
      timeLabel: timeLabel(poll),
    }),
  }

  return <Layout {...layoutProps} />
}
