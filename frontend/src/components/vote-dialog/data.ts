import type { Poll, VoteOption } from '@/lib/poll/types'

export interface VoteDialogProps {
  poll: Poll
  initialOption?: VoteOption
  onClose: () => void
  onVoted: () => void
}

export interface VoteDialogLayoutProps extends VoteDialogProps {
  option?: VoteOption
  onOptionChange: (option: VoteOption) => void
  submitting: boolean
  onConfirm: () => void
}
