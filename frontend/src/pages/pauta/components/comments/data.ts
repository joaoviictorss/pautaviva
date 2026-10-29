export interface PollComment {
  id: string
  text: string
  createdAt: string
  author: {
    name: string
    image: string | null
  }
}

export interface CommentsProps {
  pollId: string
  commentable: boolean
}

export interface CommentsLayoutProps extends CommentsProps {
  comments: PollComment[]
  text: string
  loading: boolean
  submitting: boolean
  signedIn: boolean
  canComment: boolean
  error?: string
  notice?: string
  onTextChange: (text: string) => void
  onSubmit: () => void
}
