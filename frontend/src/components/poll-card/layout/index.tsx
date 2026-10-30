import { Link } from '@tanstack/react-router'
import { ArrowRightIcon, PencilIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

import type { PollCardLayoutProps } from '../data'

export function PollCard({
  poll,
  showDetails,
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
    <Card className="gap-3.5 rounded-2xl px-4.5 py-4.5 transition hover:-translate-y-0.5 hover:shadow-lg">
      <CardHeader className="flex items-center justify-between gap-2 px-0">
        <Badge className="h-7 gap-1.5 pr-2.5 pl-2 font-semibold" style={categoryLook.style}>
          <CategoryIcon className="size-3.5" />
          {poll.category.name}
        </Badge>
        <Badge className={cn(statusClassName)}>{statusLabel}</Badge>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-1.5 px-0">
        <CardTitle className="text-[17px] font-bold tracking-tight text-pretty">{poll.title}</CardTitle>
        <CardDescription className="line-clamp-3 leading-relaxed">{poll.description}</CardDescription>
        {timeLabel && (
          <p className="m-0 mt-1 text-xs font-semibold text-amber-700 dark:text-amber-400">{timeLabel}</p>
        )}
      </CardContent>

      {bar && (
        <CardContent className="flex flex-col gap-2 px-0">
          <div role="img" aria-label={bar.label} className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-muted">
            {bar.segments.map((segment) => (
              <span key={segment.key} style={{ width: `${segment.percent}%`, background: segment.color }} />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">{participationsLabel}</span>
        </CardContent>
      )}

      <CardFooter className="-mx-4.5 flex items-center justify-between gap-3 border-t px-4.5 pt-3.5 text-xs text-muted-foreground">
        <span>{scheduleLabel}</span>
        {onEditClick && (
          <Button variant="outline" size="sm" onClick={onEditClick} className="shrink-0">
            <PencilIcon />
            Editar
          </Button>
        )}
        {showDetails && (
          <Button
            nativeButton={false}
            variant="outline"
            size="sm"
            render={<Link to="/pautas/$pollId" params={{ pollId: poll.id }} />}
            className="shrink-0"
          >
            Detalhes
            <ArrowRightIcon />
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
