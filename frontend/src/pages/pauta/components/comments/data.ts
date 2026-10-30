export interface PollComment {
  id: string
  text: string
  createdAt: string
  author: {
    name: string
    image: string | null
  }
  /** Comentário do próprio leitor, ainda em moderação. */
  pending?: boolean
}

export type CommentReportReason = 'OFFENSIVE_CONTENT' | 'SPAM' | 'HATE_SPEECH' | 'OTHER'

export interface CommentsProps {
  pollId: string
  commentable: boolean
}

export interface CommentsLayoutProps extends CommentsProps {
  comments: PollComment[]
  publishedCount: number
  viewer?: { name: string; image?: string | null }
  text: string
  loading: boolean
  submitting: boolean
  signedIn: boolean
  canComment: boolean
  reportOpen: boolean
  reportReason: CommentReportReason
  reporting: boolean
  error?: string
  notice?: string
  onTextChange: (text: string) => void
  onSubmit: () => void
  onReportOpenChange: (open: boolean) => void
  onReportReasonChange: (reason: CommentReportReason) => void
  onOpenReport: (commentId: string) => void
  onReport: () => void
}
