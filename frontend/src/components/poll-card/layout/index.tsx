import { Link } from '@tanstack/react-router'
import { ClockIcon, PencilIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

import type { PollCardLayoutProps } from '../data'

export function PollCard({
  poll,
  linked,
  categoryLook,
  statusLabel,
  statusClassName,
  bar,
  participationsLabel,
  scheduleLabel,
  timeLabel,
  onEditClick,
}: PollCardLayoutProps) {
  const CategoryIcon = categoryLook.icon

  return (
    <Card className="relative gap-3.5 rounded-2xl px-4.5 py-4.5 transition hover:-translate-y-0.5 hover:shadow-lg">
      <CardHeader className="flex items-center justify-between gap-2 px-0">
        <Badge className="h-7 gap-1.5 pr-2.5 pl-2 font-semibold" style={categoryLook.style}>
          <CategoryIcon />
          {poll.category.name}
        </Badge>
        <Badge className={cn('h-6 px-2.5 font-semibold', statusClassName)}>{statusLabel}</Badge>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-1.5 px-0">
        <CardTitle className="text-[17px] font-bold tracking-tight text-pretty">
          {linked ? (
            <Link
              to="/pautas/$id"
              params={{ id: poll.id }}
              className="text-inherit no-underline after:absolute after:inset-0 after:rounded-2xl hover:no-underline"
            >
              {poll.title}
            </Link>
          ) : (
            poll.title
          )}
        </CardTitle>
        <CardDescription className="line-clamp-2 leading-relaxed">{poll.description}</CardDescription>
      </CardContent>

      {bar && (
        <CardContent className="flex items-center gap-2.5 px-0">
          <div role="img" aria-label={bar.label} className="flex h-2 flex-1 gap-0.5 overflow-hidden rounded-full bg-muted">
            {bar.segments.map((segment) => (
              <span key={segment.key} style={{ width: `${segment.percent}%`, background: segment.color }} />
            ))}
          </div>
          <span className="text-[13px] font-semibold whitespace-nowrap">{bar.forLabel}</span>
        </CardContent>
      )}

      <CardFooter className="min-h-9 gap-3 border-t px-0 pt-3.5 text-[13px] text-muted-foreground">
        <span className="flex-1">{participationsLabel ?? scheduleLabel}</span>
        {timeLabel && (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <ClockIcon className="size-3.5" />
            {timeLabel}
          </span>
        )}
        {onEditClick && (
          <Button variant="outline" size="sm" onClick={onEditClick}>
            <PencilIcon />
            Editar
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
