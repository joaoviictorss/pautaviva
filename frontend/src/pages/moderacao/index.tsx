import { useCallback, useEffect, useState } from 'react'

import { api } from '@/lib/api/client'

import { Moderacao as Layout } from './layout'
import type { ModeracaoLayoutProps, ModeracaoProps, ModerationComment } from './data'

export function Moderacao(_props: ModeracaoProps) {
  const [comments, setComments] = useState<ModerationComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [processingId, setProcessingId] = useState<string>()

  const load = useCallback(async () => {
    try {
      setComments(await api<ModerationComment[]>('/moderation/comments'))
      setError(undefined)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar a fila de moderação.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const decide = useCallback(async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setProcessingId(id)
    setError(undefined)
    try {
      await api(`/moderation/comments/${encodeURIComponent(id)}`, { method: 'PATCH', json: { status } })
      setComments((current) => current.filter((comment) => comment.id !== id))
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : 'Não foi possível moderar o comentário.')
    } finally {
      setProcessingId(undefined)
    }
  }, [])

  const layoutProps: ModeracaoLayoutProps = {
    comments,
    loading,
    error,
    processingId,
    onDecision: (id, status) => void decide(id, status),
  }
  return <Layout {...layoutProps} />
}
