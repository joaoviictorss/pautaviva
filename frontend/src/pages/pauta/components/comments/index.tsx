import { useCallback, useEffect, useState } from 'react'

import { api } from '@/lib/api/client'
import { useSession } from '@/lib/auth/client'

import { Comments as Layout } from './layout'
import type { CommentsLayoutProps, CommentsProps, PollComment } from './data'

export function Comments({ pollId, commentable }: CommentsProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<PollComment[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string>()
  const [notice, setNotice] = useState<string>()

  const load = useCallback(async () => {
    try {
      setComments(await api<PollComment[]>(`/polls/${encodeURIComponent(pollId)}/comments`))
      setError(undefined)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os comentários.')
    } finally {
      setLoading(false)
    }
  }, [pollId])

  useEffect(() => {
    void load()
  }, [load])

  const submit = useCallback(async () => {
    setError(undefined)
    setNotice(undefined)
    setSubmitting(true)
    try {
      await api(`/polls/${encodeURIComponent(pollId)}/comments`, {
        method: 'POST',
        json: { text },
      })
      setText('')
      setNotice('Comentário enviado para análise. Ele ficará visível após a aprovação da moderação.')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível enviar o comentário.')
    } finally {
      setSubmitting(false)
    }
  }, [pollId, text])

  const layoutProps: CommentsLayoutProps = {
    pollId,
    commentable,
    comments,
    text,
    loading,
    submitting,
    signedIn: !!session,
    canComment: session?.user.role === 'CITIZEN',
    error,
    notice,
    onTextChange: setText,
    onSubmit: () => void submit(),
  }

  return <Layout {...layoutProps} />
}
