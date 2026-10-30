import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRightIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { ClosingPollRow, ParticipationRow, UpcomingPollRow } from '@/lib/poll/rows'

type PollRoute = '/admin/pautas/$pollId' | '/pautas/$pollId'

const LIST_ROW = '-mx-2 border-t px-2 py-3 transition-colors hover:bg-muted/50'

export function ClosingRow({ poll, to }: { poll: ClosingPollRow; to: PollRoute }) {
  return (
    <Link
      to={to}
      params={{ pollId: poll.id }}
      className={cn(LIST_ROW, 'flex flex-col gap-2 rounded-xl text-inherit no-underline hover:no-underline')}
    >
      <span className="flex items-center justify-between gap-3">
        <span className="min-w-0 truncate text-sm font-semibold">{poll.title}</span>
        <span
          className={cn(
            'inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-xs font-semibold whitespace-nowrap',
            poll.urgent ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground',
          )}
        >
          {poll.timeLabel}
        </span>
      </span>
      <span className="flex items-center gap-2.5">
        <span role="img" aria-label={poll.bar.label} className="flex h-1.5 flex-1 gap-0.5 overflow-hidden rounded-full bg-muted">
          {poll.bar.segments.filter((segment) => segment.percent > 0).map((segment) => (
            <span key={segment.key} style={{ flex: segment.percent, background: segment.color }} />
          ))}
        </span>
        <span className="text-xs whitespace-nowrap text-muted-foreground">{poll.participationsLabel}</span>
      </span>
    </Link>
  )
}

export function UpcomingRow({ poll, to, action }: { poll: UpcomingPollRow; to: PollRoute; action?: ReactNode }) {
  return (
    <div className={cn(LIST_ROW, 'relative flex items-center gap-3 rounded-xl')}>
      <div className="flex h-12.5 w-11.5 shrink-0 flex-col items-center justify-center rounded-xl bg-[oklch(0.95_0.03_255)] leading-tight text-[oklch(0.48_0.15_259)]">
        <span className="text-lg font-extrabold">{poll.day}</span>
        <span className="text-[11px] font-semibold uppercase">{poll.month}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Link
          to={to}
          params={{ pollId: poll.id }}
          className="truncate text-sm font-semibold text-inherit no-underline after:absolute after:inset-0 after:rounded-xl hover:no-underline"
        >
          {poll.title}
        </Link>
        <span className="text-xs text-muted-foreground">{poll.detail}</span>
      </div>
      {action}
    </div>
  )
}

export function ParticipationRowLink({ item }: { item: ParticipationRow }) {
  const CategoryIcon = item.categoryLook.icon

  return (
    <Link
      to="/pautas/$pollId"
      params={{ pollId: item.id }}
      className={cn(LIST_ROW, 'flex items-center gap-3 rounded-xl text-inherit no-underline hover:no-underline')}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-xl" style={item.categoryLook.style}>
        <CategoryIcon className="size-4" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-semibold">{item.title}</span>
        <span className="text-xs text-muted-foreground">{item.detail}</span>
      </span>
      <span className="hidden shrink-0 text-[13px] font-semibold text-primary @lg:inline">{item.actionLabel}</span>
      <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  )
}
