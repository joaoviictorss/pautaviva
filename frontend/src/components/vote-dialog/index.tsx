import { useState } from 'react'

import { useVote } from '@/hooks/use-vote'
import type { VoteOption } from '@/lib/poll/types'

import { VoteDialog as Layout } from './layout'
import type { VoteDialogLayoutProps, VoteDialogProps } from './data'

export function VoteDialog(props: VoteDialogProps) {
  const { poll, initialOption, onClose, onVoted } = props
  const [option, setOption] = useState<VoteOption | undefined>(initialOption)
  const { submitting, vote } = useVote(poll.id, () => {
    onClose()
    onVoted()
  })

  const layoutProps: VoteDialogLayoutProps = {
    ...props,
    option,
    onOptionChange: setOption,
    submitting,
    onConfirm: () => {
      if (option) void vote(option)
    },
  }

  return <Layout {...layoutProps} />
}
