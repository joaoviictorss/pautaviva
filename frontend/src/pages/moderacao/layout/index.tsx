import { Link } from '@tanstack/react-router'
import { CheckCheckIcon, CheckIcon, CircleAlertIcon, CircleCheckIcon, FlagIcon, Undo2Icon, XIcon } from 'lucide-react'

import { RejectCommentDialog } from '@/components/reject-comment-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import type { ModeracaoLayoutProps } from '../data'

const PRIMARY_ACTION = 'border-foreground bg-foreground text-background hover:bg-foreground/85 hover:text-background'
const ROW_ACTION = 'h-8.5 rounded-[11px] px-3.5 text-[13px] font-semibold'

export function Moderacao({
  tabs,
  tab,
  onTabChange,
  pollOptions,
  pollFilter,
  onPollFilterChange,
  items,
  loading,
  error,
  allSelected,
  selectedCount,
  bulkLabel,
  onToggleAll,
  onToggleItem,
  onKeep,
  onDiscard,
  onUndo,
  rejectDialog,
}: ModeracaoLayoutProps) {
  const isQueue = tab !== 'HISTORY'
  const selectedIds = items.filter((item) => item.selected).map((item) => item.id)

  return (
    <section className="flex animate-[word-in_.35s_cubic-bezier(.16,1,.3,1)] flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="m-0 text-[clamp(28px,3.2vw,38px)] font-extrabold tracking-tighter">Moderação</h1>
        <p className="m-0 text-[15px] text-muted-foreground">Comentários só aparecem na pauta depois de aprovados.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((option) => (
            <Button
              key={option.value}
              variant="outline"
              aria-pressed={option.value === tab}
              onClick={() => onTabChange(option.value)}
              className={cn(
                'h-9.5 gap-2 rounded-full px-4 font-semibold',
                option.value === tab &&
                  'border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground',
              )}
            >
              {option.label}
              <span className="font-mono text-xs font-medium opacity-75">{option.count}</span>
            </Button>
          ))}
        </div>
        <Select items={pollOptions} value={pollFilter} onValueChange={(value) => value && onPollFilterChange(value)}>
          <SelectTrigger aria-label="Filtrar por pauta" className="h-9.5 max-w-full rounded-full bg-card px-3.5 font-semibold">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pollOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : items.length ? (
        <>
          {isQueue && (
            <div className={cn('flex min-h-11 flex-wrap items-center gap-3 rounded-2xl pr-1.5 pl-3.5', selectedCount && 'bg-accent')}>
              <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm font-semibold">
                <Checkbox checked={allSelected} onCheckedChange={onToggleAll} />
                {bulkLabel}
              </label>
              {selectedCount > 0 && (
                <div className="ml-auto flex gap-2 py-1.25">
                  <Button variant="outline" className={cn(ROW_ACTION, PRIMARY_ACTION)} onClick={() => onKeep(selectedIds)}>
                    <CheckCheckIcon />
                    Aprovar selecionados
                  </Button>
                  <Button variant="outline" className={cn(ROW_ACTION, 'bg-card')} onClick={() => onDiscard(selectedIds)}>
                    <XIcon />
                    Rejeitar
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <Card key={item.id} className={cn('flex-row gap-3.5 rounded-2xl p-4.5', item.selected && 'border-primary')}>
                {isQueue && (
                  <Checkbox
                    className="mt-1.5"
                    checked={item.selected}
                    aria-label={`Selecionar comentário de ${item.author}`}
                    onCheckedChange={() => onToggleItem(item.id)}
                  />
                )}
                <Avatar className="size-9">
                  <AvatarImage src={item.avatar} alt="" />
                  <AvatarFallback className="text-xs">{item.initials}</AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                  <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1.5">
                    <span className="text-sm font-semibold">{item.author}</span>
                    <span className="text-[13px] text-muted-foreground">
                      em{' '}
                      <Link
                        to="/admin/pautas/$pollId"
                        params={{ pollId: item.pollId }}
                        className="font-semibold text-primary no-underline hover:underline"
                      >
                        {item.pollTitle}
                      </Link>
                    </span>
                    <span
                      className={cn(
                        'ml-auto text-xs whitespace-nowrap',
                        item.overdue ? 'font-semibold text-[oklch(0.5_0.13_70)]' : 'text-muted-foreground',
                      )}
                    >
                      {item.age}
                    </span>
                  </div>
                  <p className="m-0 text-[15px] leading-relaxed text-pretty whitespace-pre-wrap">{item.text}</p>
                  {item.note && <p className="m-0 text-[13px] text-muted-foreground">{item.note}</p>}
                  <div className="flex flex-wrap items-center gap-2">
                    {item.badge && (
                      <Badge variant={item.badge === 'Suspeito' ? 'destructive' : 'outline'} className="h-6 font-semibold">
                        {item.badge}
                      </Badge>
                    )}
                    {item.flag && (
                      <span className="inline-flex h-6 items-center gap-1.25 rounded-full bg-[oklch(0.96_0.03_23)] pr-2.25 pl-1.75 text-xs font-semibold text-[oklch(0.5_0.17_23)]">
                        <FlagIcon className="size-3" />
                        {item.flag}
                      </span>
                    )}
                    {item.decision && (
                      <>
                        <span
                          className={cn(
                            'inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold',
                            item.decision.approved
                              ? 'bg-[oklch(0.95_0.04_150)] text-[oklch(0.42_0.12_150)]'
                              : 'bg-[oklch(0.96_0.03_23)] text-[oklch(0.5_0.17_23)]',
                          )}
                        >
                          {item.decision.label}
                        </span>
                        <span className="text-xs text-muted-foreground">{item.decision.meta}</span>
                      </>
                    )}
                    <div className="ml-auto flex gap-2">
                      {isQueue ? (
                        <>
                          <Button
                            variant="outline"
                            disabled={item.processing}
                            className={cn(ROW_ACTION, PRIMARY_ACTION)}
                            onClick={() => onKeep([item.id])}
                          >
                            <CheckIcon />
                            {item.keepLabel}
                          </Button>
                          <Button
                            variant="outline"
                            disabled={item.processing}
                            className={ROW_ACTION}
                            onClick={() => onDiscard([item.id])}
                          >
                            <XIcon />
                            {item.discardLabel}
                          </Button>
                        </>
                      ) : (
                        item.undoable && (
                          <Button
                            variant="outline"
                            disabled={item.processing}
                            className={ROW_ACTION}
                            onClick={() => onUndo(item.id)}
                          >
                            <Undo2Icon />
                            Desfazer
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed px-6 py-14 text-center">
          <span className="grid size-10 place-items-center rounded-2xl bg-[oklch(0.95_0.04_150)] text-[oklch(0.45_0.13_150)]">
            <CircleCheckIcon className="size-5" />
          </span>
          <span className="text-[17px] font-bold">{isQueue ? 'Fila zerada' : 'Nenhuma decisão ainda'}</span>
          <span className="text-sm text-muted-foreground">
            {isQueue ? 'Nenhum comentário aguardando nesta visão.' : 'Aprovações e rejeições aparecem aqui.'}
          </span>
        </div>
      )}

      <RejectCommentDialog {...rejectDialog} />
    </section>
  )
}
