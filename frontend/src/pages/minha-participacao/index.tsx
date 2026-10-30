import { useEffect, useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { toast } from '@/components/ui/toast'
import { api } from '@/lib/api/client'
import { fetchAllParticipations } from '@/lib/poll/participations'
import { toParticipationRow } from '@/lib/poll/rows'
import { COMMENT_STATUS } from '@/lib/poll/status'
import type { MyComment } from '@/lib/poll/types'
import { downloadFile } from '@/lib/utils/download'

import { MinhaParticipacao as Layout } from './layout'
import type {
  CommentItem,
  MinhaParticipacaoLayoutProps,
  MinhaParticipacaoProps,
  ParticipationPage,
  ParticipationTab,
} from './data'

const route = getRouteApi('/_comunidade/_autenticado/minha-participacao')

interface Participation {
  votes: ParticipationPage
  comments: MyComment[]
}

function toCommentItem({ id, poll, text, status, createdAt, moderationReason }: MyComment): CommentItem {
  return {
    id,
    pollId: poll.id,
    pollTitle: poll.title,
    text,
    dateLabel: format(new Date(createdAt), "dd 'de' MMM 'às' HH:mm", { locale: ptBR }),
    statusLabel: COMMENT_STATUS[status].label,
    statusClassName: COMMENT_STATUS[status].className,
    rejectionReason: status === 'REJECTED' || status === 'REMOVED' ? (moderationReason ?? undefined) : undefined,
    canResubmit: status === 'REJECTED' && poll.status !== 'CLOSED' && new Date(poll.endsAt) > new Date(),
    canDelete: status !== 'REMOVED',
  }
}

const csvCell = (value: string) => `"${value.replaceAll('"', '""')}"`

async function downloadHistory() {
  const items = await fetchAllParticipations()

  // Só registra a participação: a opção de voto não existe associada à pessoa.
  const rows = [
    ['Pauta', 'Categoria', 'Data da participação'],
    ...items.map(({ participatedAt, poll }) => [poll.title, poll.category.name, format(new Date(participatedAt), 'dd/MM/yyyy HH:mm')]),
  ]
  const csv = rows.map((row) => row.map(csvCell).join(';')).join('\r\n')
  downloadFile('meu-historico-pautaviva.csv', ['\ufeff', csv], 'text/csv;charset=utf-8')
}

export function MinhaParticipacao(_props: MinhaParticipacaoProps) {
  const navigate = useNavigate()
  const { page = 1, tab = 'votos' } = route.useSearch()
  const [data, setData] = useState<Participation>()
  const [reloads, setReloads] = useState(0)
  const [editingId, setEditingId] = useState<string>()
  const [editingText, setEditingText] = useState('')
  const [deletingId, setDeletingId] = useState<string>()
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  useEffect(() => {
    let active = true
    Promise.all([
      api<ParticipationPage>(`/participations/me?page=${page}&pageSize=9`),
      api<MyComment[]>('/comments/me'),
    ])
      .then(([votes, comments]) => {
        if (active) {
          setData({ votes, comments })
          setError(undefined)
        }
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar sua participação.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [page, reloads])

  const reload = () => setReloads((current) => current + 1)

  async function resubmit() {
    if (!editingId) return
    setSaving(true)
    try {
      await api(`/comments/${encodeURIComponent(editingId)}`, { method: 'PATCH', json: { text: editingText } })
      toast.add({ type: 'success', title: 'Comentário reenviado', description: 'Ele voltou para a análise da moderação.' })
      setEditingId(undefined)
      reload()
    } catch (saveError) {
      toast.add({ type: 'error', title: 'Não foi possível reenviar', description: (saveError as Error).message })
    } finally {
      setSaving(false)
    }
  }

  async function deleteComment() {
    if (!deletingId) return
    setSaving(true)
    try {
      await api(`/comments/${encodeURIComponent(deletingId)}`, { method: 'DELETE' })
      toast.add({ type: 'success', title: 'Comentário excluído' })
      reload()
    } catch (deleteError) {
      toast.add({ type: 'error', title: 'Não foi possível excluir', description: (deleteError as Error).message })
    } finally {
      setSaving(false)
      setDeletingId(undefined)
    }
  }

  async function download() {
    setDownloading(true)
    try {
      await downloadHistory()
    } catch (downloadError) {
      toast.add({ type: 'error', title: 'Não foi possível baixar o histórico', description: (downloadError as Error).message })
    } finally {
      setDownloading(false)
    }
  }

  const months: MinhaParticipacaoLayoutProps['months'] = []
  for (const item of data?.votes.items ?? []) {
    const label = format(new Date(item.participatedAt), 'MMMM yyyy', { locale: ptBR })
    const row = toParticipationRow(item)
    const month = months.at(-1)
    if (month?.label === label) month.items.push(row)
    else months.push({ label, items: [row] })
  }

  const layoutProps: MinhaParticipacaoLayoutProps = {
    tabs: [
      { value: 'votos', label: 'Votos', count: data?.votes.total },
      { value: 'comentarios', label: 'Comentários', count: data?.comments.length },
    ],
    tab,
    months,
    comments: (data?.comments ?? []).map(toCommentItem),
    total: data?.votes.total ?? 0,
    page,
    pageSize: data?.votes.pageSize ?? 9,
    editingId,
    editingText,
    deletingId,
    saving,
    downloading,
    loading,
    error,
    onTabChange: (nextTab: ParticipationTab) => navigate({ to: '/minha-participacao', search: { tab: nextTab }, replace: true }),
    onPageChange: (nextPage) => navigate({ to: '/minha-participacao', search: { tab, page: nextPage } }),
    onEdit: ({ id, text }) => {
      setEditingId(id)
      setEditingText(text)
    },
    onEditingTextChange: setEditingText,
    onCancelEdit: () => setEditingId(undefined),
    onResubmit: () => void resubmit(),
    onAskDelete: setDeletingId,
    onDelete: () => void deleteComment(),
    onDownload: () => void download(),
  }

  return <Layout {...layoutProps} />
}
