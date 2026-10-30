import { useCallback, useEffect, useState } from 'react'

import { useLiveRefresh } from '@/hooks/use-live-refresh'
import { api } from '@/lib/api/client'
import { useSession } from '@/lib/auth/client'

import { Comments as Layout } from './layout'
import type { MyComment } from '@/lib/poll/types'

import type { CommentReportReason, CommentsLayoutProps, CommentsProps, PollComment } from './data'

export function Comments({ pollId, commentable }: CommentsProps) {
  const { data: session } = useSession()
  const user = session?.user
  const canComment = user?.role === 'CITIZEN'
  const [comments, setComments] = useState<PollComment[]>([])
  const [ownPending, setOwnPending] = useState<MyComment[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [reportReason, setReportReason] = useState<CommentReportReason>('OFFENSIVE_CONTENT')
  const [reportedCommentId, setReportedCommentId] = useState<string>()
  const [error, setError] = useState<string>()
  const [notice, setNotice] = useState<string>()

  const load = useCallback(async () => {
    try {
      const [published, mine] = await Promise.all([
        api<PollComment[]>(`/polls/${encodeURIComponent(pollId)}/comments`),
        canComment ? api<MyComment[]>('/comments/me') : [],
      ])
      setComments(published)
      setOwnPending(mine.filter(({ poll, status }) => poll.id === pollId && status === 'PENDING'))
      setError(undefined)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os comentários.')
    } finally {
      setLoading(false)
    }
  }, [pollId, canComment])

  useEffect(() => {
    void load()
  }, [load])

  useLiveRefresh(['comments-changed'], () => void load(), pollId)

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
      setNotice('Comentário enviado. Ele aparece aqui assim que passar pela análise automática ou, se precisar, pela moderação.')
      void load()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível enviar o comentário.')
    } finally {
      setSubmitting(false)
    }
  }, [load, pollId, text])

  const report = useCallback(async () => {
    if (!reportedCommentId) return
    setError(undefined)
    setNotice(undefined)
    setReporting(true)
    try {
      await api(`/comments/${encodeURIComponent(reportedCommentId)}/reports`, {
        method: 'POST',
        json: { reason: reportReason },
      })
      setReportOpen(false)
      setReportedCommentId(undefined)
      setNotice('Denúncia enviada à equipe de moderação.')
    } catch (reportError) {
      setReportOpen(false)
      setError(reportError instanceof Error ? reportError.message : 'Não foi possível denunciar o comentário.')
    } finally {
      setReporting(false)
    }
  }, [reportReason, reportedCommentId])

  const layoutProps: CommentsLayoutProps = {
    pollId,
    commentable,
    comments: [
      ...(user
        ? ownPending.map(({ id, text: ownText, createdAt }) => ({
            id,
            text: ownText,
            createdAt,
            author: { name: user.name, image: user.image ?? null },
            pending: true,
          }))
        : []),
      ...comments,
    ],
    publishedCount: comments.length,
    viewer: user,
    text,
    loading,
    submitting,
    signedIn: !!session,
    canComment,
    reportOpen,
    reportReason,
    reporting,
    error,
    notice,
    onTextChange: setText,
    onSubmit: () => void submit(),
    onReportOpenChange: setReportOpen,
    onReportReasonChange: setReportReason,
    onOpenReport: (commentId) => {
      setReportedCommentId(commentId)
      setReportReason('OFFENSIVE_CONTENT')
      setReportOpen(true)
    },
    onReport: () => void report(),
  }

  return <Layout {...layoutProps} />
}
