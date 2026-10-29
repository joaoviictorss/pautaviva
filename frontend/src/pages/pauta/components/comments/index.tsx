import { useCallback, useEffect, useState } from 'react'

import { api } from '@/lib/api/client'
import { useSession } from '@/lib/auth/client'

import { Comments as Layout } from './layout'
import type { CommentReportReason, CommentsLayoutProps, CommentsProps, PollComment } from './data'

export function Comments({ pollId, commentable }: CommentsProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<PollComment[]>([])
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
    comments,
    text,
    loading,
    submitting,
    signedIn: !!session,
    canComment: session?.user.role === 'CITIZEN',
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
