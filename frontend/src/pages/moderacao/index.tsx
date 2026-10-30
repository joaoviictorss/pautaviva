import { useCallback, useEffect, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'

import { toast } from '@/components/ui/toast'
import { useLiveRefresh } from '@/hooks/use-live-refresh'
import { useModerationQueue } from '@/hooks/use-moderation-queue'
import { api } from '@/lib/api/client'
import { getDefaultAvatar } from '@/lib/utils/avatar'
import { formatAge, getInitials, isOlderThanDay } from '@/lib/utils/format'

import { Moderacao as Layout } from './layout'
import type {
  ModeracaoItem,
  ModeracaoLayoutProps,
  ModeracaoProps,
  ModeracaoTab,
  ModerationComment,
  ModerationDecision,
} from './data'

const route = getRouteApi('/_autenticado/admin/moderacao')

const ALL_POLLS = 'ALL'

const CLASSIFICATION_BADGES = { SUSPECT: 'Suspeito', INAPPROPRIATE: 'Impróprio' }

const REPORT_REASONS = {
  OFFENSIVE_CONTENT: 'Conteúdo ofensivo',
  SPAM: 'Spam',
  HATE_SPEECH: 'Discurso de ódio',
  OTHER: 'Outro',
}

const DECISION_LABELS = { APPROVED: 'Aprovado', REJECTED: 'Rejeitado', REMOVED: 'Removido' }

function screeningBadge({ status, classification }: ModerationComment) {
  if (status !== 'PENDING') return undefined
  // sem classificação: a triagem ainda está rodando ou nem a IA nem a lista conseguiram avaliar
  if (!classification) return 'Sem triagem'
  return classification === 'ADEQUATE' ? undefined : CLASSIFICATION_BADGES[classification]
}

function screeningNote({ moderationReason, reports }: ModerationComment) {
  if (reports.length) return `Motivos: ${[...new Set(reports.map(({ reason }) => REPORT_REASONS[reason]))].join(', ')}`
  return moderationReason ? `Por que foi sinalizado: ${moderationReason}` : undefined
}

export function Moderacao(_props: ModeracaoProps) {
  const { q = '', pauta } = route.useSearch()
  const [tab, setTab] = useState<ModeracaoTab>('PENDING')
  const [pollFilter, setPollFilter] = useState(pauta ?? ALL_POLLS)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [rejecting, setRejecting] = useState<ModerationComment[]>([])
  const [history, setHistory] = useState<ModerationDecision[]>([])
  const [undoingId, setUndoingId] = useState<string>()
  const [historyError, setHistoryError] = useState<string>()

  const loadHistory = useCallback(async () => {
    try {
      setHistory(await api<ModerationDecision[]>('/moderation/comments/history'))
      setHistoryError(undefined)
    } catch (loadError) {
      setHistoryError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar o histórico.')
    }
  }, [])

  const { comments, loading, error, processingIds, decide, reload } = useModerationQueue(true, () => void loadHistory())

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  // decisões de outros moderadores também entram no histórico
  useLiveRefresh(['comments-changed'], () => void loadHistory())

  const term = q.trim().toLowerCase()
  function matches(comment: { text: string; author: { name: string }; poll: { id: string } }) {
    return (
      (pollFilter === ALL_POLLS || comment.poll.id === pollFilter) &&
      (!term || comment.text.toLowerCase().includes(term) || comment.author.name.toLowerCase().includes(term))
    )
  }

  const pending = comments.filter(matches).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const reported = pending.filter((comment) => comment.reports.length)
  const decisions = history.filter(matches)
  const queue = tab === 'REPORTED' ? reported : pending
  const selected = queue.filter((comment) => selectedIds.includes(comment.id))
  const pollTitles = new Map([...comments, ...history].map(({ poll }) => [poll.id, poll.title]))

  const changeTab = (next: ModeracaoTab) => {
    setTab(next)
    setSelectedIds([])
  }

  const queueItems: ModeracaoItem[] = queue.map((comment) => ({
    id: comment.id,
    author: comment.author.name,
    avatar: comment.author.image ?? getDefaultAvatar(comment.author.name),
    initials: getInitials(comment.author.name),
    pollId: comment.poll.id,
    pollTitle: comment.poll.title,
    age: formatAge(comment.createdAt),
    overdue: isOlderThanDay(comment.createdAt),
    text: comment.text,
    badge: screeningBadge(comment),
    flag: comment.reports.length ? `Denunciado ${comment.reports.length}×` : undefined,
    note: screeningNote(comment),
    selected: selectedIds.includes(comment.id),
    processing: processingIds.includes(comment.id),
    keepLabel: comment.status === 'PENDING' ? 'Aprovar' : 'Manter',
    discardLabel: comment.status === 'PENDING' ? 'Rejeitar' : 'Remover',
    undoable: false,
  }))

  const historyItems: ModeracaoItem[] = decisions.map((decision) => ({
    id: decision.id,
    author: decision.author.name,
    avatar: decision.author.image ?? getDefaultAvatar(decision.author.name),
    initials: getInitials(decision.author.name),
    pollId: decision.poll.id,
    pollTitle: decision.poll.title,
    age: formatAge(decision.updatedAt),
    overdue: false,
    text: decision.text,
    selected: false,
    processing: undoingId === decision.id,
    keepLabel: '',
    discardLabel: '',
    decision: {
      label: DECISION_LABELS[decision.status],
      approved: decision.status === 'APPROVED',
      meta: [decision.status === 'APPROVED' ? undefined : decision.moderationReason, `por ${decision.moderatedBy.name}`]
        .filter(Boolean)
        .join(' · '),
    },
    // a remoção já encerrou as denúncias: reabrir exigiria refazer esse fluxo
    undoable: decision.status !== 'REMOVED',
  }))

  async function handleUndo(id: string) {
    setUndoingId(id)
    try {
      await api(`/moderation/comments/${encodeURIComponent(id)}`, { method: 'PATCH', json: { action: 'UNDO' } })
    } catch (undoError) {
      toast.add({
        type: 'error',
        title: 'Não foi possível desfazer a decisão',
        description: undoError instanceof Error ? undoError.message : undefined,
      })
    }
    await Promise.all([reload(), loadHistory()])
    setUndoingId(undefined)
  }

  const targets = (ids: string[]) => comments.filter((comment) => ids.includes(comment.id))

  const layoutProps: ModeracaoLayoutProps = {
    tabs: [
      { value: 'PENDING', label: 'Pendentes', count: pending.length },
      { value: 'REPORTED', label: 'Denunciados', count: reported.length },
      { value: 'HISTORY', label: 'Histórico', count: decisions.length },
    ],
    tab,
    onTabChange: changeTab,
    pollOptions: [
      { value: ALL_POLLS, label: 'Todas as pautas' },
      ...[...pollTitles].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label)),
    ],
    pollFilter,
    onPollFilterChange: (pollId) => {
      setPollFilter(pollId)
      setSelectedIds([])
    },
    items: tab === 'HISTORY' ? historyItems : queueItems,
    loading,
    error: error ?? historyError,
    allSelected: queue.length > 0 && selected.length === queue.length,
    selectedCount: selected.length,
    bulkLabel: selected.length
      ? `${selected.length} selecionado${selected.length > 1 ? 's' : ''}`
      : 'Selecionar todos',
    onToggleAll: () => setSelectedIds(selected.length === queue.length ? [] : queue.map((comment) => comment.id)),
    onToggleItem: (id) =>
      setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id])),
    onKeep: (ids) => {
      setSelectedIds([])
      void decide(targets(ids), true)
    },
    onDiscard: (ids) => setRejecting(targets(ids)),
    onUndo: (id) => void handleUndo(id),
    rejectDialog: {
      count: rejecting.length,
      removing: rejecting.length > 0 && rejecting.every((comment) => comment.status === 'APPROVED'),
      flagged: rejecting.some((comment) => comment.reports.length),
      processing: processingIds.length > 0,
      onCancel: () => setRejecting([]),
      onConfirm: (reason) => {
        setRejecting([])
        setSelectedIds([])
        void decide(rejecting, false, reason)
      },
    },
  }

  return <Layout {...layoutProps} />
}
