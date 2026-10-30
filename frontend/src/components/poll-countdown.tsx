import { TimerIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { useCountdown } from '@/hooks/use-countdown'

export function PollCountdown({ endsAt }: { endsAt: string }) {
  const { shortLabel } = useCountdown(new Date(endsAt).getTime())

  return (
    <Badge variant="outline" className="h-7 gap-1.5 px-3 font-semibold">
      <TimerIcon />
      Encerra em {shortLabel}
    </Badge>
  )
}
