import { CircleCheckIcon, CircleXIcon, MinusCircleIcon } from 'lucide-react'

import { getOutcome } from '@/lib/poll/votes'
import type { Poll } from '@/lib/poll/types'

export function PollOutcome({ results }: Pick<Poll, 'results'>) {
  const outcome = getOutcome(results)
  const Icon = outcome === 'Aprovada' ? CircleCheckIcon : outcome === 'Rejeitada' ? CircleXIcon : MinusCircleIcon

  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
      <Icon className="size-4" />
      {outcome}
    </span>
  )
}
