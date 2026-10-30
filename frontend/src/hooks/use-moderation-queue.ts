import { useCallback, useEffect, useState } from 'react'

import { toast } from '@/components/ui/toast'
import { api } from '@/lib/api/client'
import type { ModerationAction, ModerationComment } from '@/pages/moderacao/data'

// comentário já publicado só chega à fila por denúncia: a decisão vira manter ou remover
function actionFor(comment: ModerationComment, keep: boolean): ModerationAction {
  if (comment.status === 'PENDING') return keep ? 'APPROVE' : 'REJECT'
  return keep ? 'DISMISS_REPORT' : 'REMOVE'
}

export function useModerationQueue(enabled = true, onDecided?: () => void) {
  const [comments, setComments] = useState<ModerationComment[]>([])
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string>()
  const [processingIds, setProcessingIds] = useState<string[]>([])

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
    if (enabled) void load()
  }, [enabled, load])

  async function decide(targets: ModerationComment[], keep: boolean, reason?: string) {
    setProcessingIds(targets.map((comment) => comment.id))
    const results = await Promise.allSettled(
      targets.map((comment) =>
        api(`/moderation/comments/${encodeURIComponent(comment.id)}`, {
          method: 'PATCH',
          json: { action: actionFor(comment, keep), reason },
        }),
      ),
    )
    const failure = results.find((result) => result.status === 'rejected')
    if (failure) {
      toast.add({
        type: 'error',
        title: 'Não foi possível moderar o comentário',
        description: failure.reason instanceof Error ? failure.reason.message : undefined,
      })
    }
    await load()
    setProcessingIds([])
    onDecided?.()
  }

  return { comments, loading, error, processingIds, decide, reload: load }
}
