import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'

import type { RejectCommentDialogLayoutProps } from '../data'

export function RejectCommentDialog({
  count,
  processing,
  title,
  actionLabel,
  reasons,
  reason,
  onReasonChange,
  onCancel,
  onSubmit,
}: RejectCommentDialogLayoutProps) {
  return (
    <Dialog open={count > 0} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="rounded-3xl sm:max-w-110">
        <DialogHeader>
          <DialogTitle className="text-[22px] font-bold tracking-tight">{title}</DialogTitle>
          <DialogDescription>A decisão e o motivo ficam registrados na trilha de auditoria.</DialogDescription>
        </DialogHeader>
        <RadioGroup aria-label="Motivo" value={reason} onValueChange={(value) => onReasonChange(value as string)} className="gap-2">
          {reasons.map((option) => (
            <label
              key={option.label}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-2xl border-[1.5px] px-3.5 py-3 transition-colors',
                option.label === reason ? 'border-destructive bg-destructive/5' : 'hover:bg-muted/50',
              )}
            >
              <RadioGroupItem value={option.label} />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold">{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </span>
            </label>
          ))}
        </RadioGroup>
        <DialogFooter className="bg-transparent">
          <Button variant="outline" className="h-11 rounded-full px-4.5" onClick={onCancel}>
            Cancelar
          </Button>
          <Button className="h-11 rounded-full bg-destructive px-5 text-white hover:bg-destructive/90" disabled={processing} onClick={onSubmit}>
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
