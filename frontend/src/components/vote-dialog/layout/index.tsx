import { LockIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { VoteOptions } from '@/components/vote-options'

import type { VoteDialogLayoutProps } from '../data'

export function VoteDialog({ poll, option, onOptionChange, submitting, onClose, onConfirm }: VoteDialogLayoutProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && !submitting && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{poll.title}</DialogTitle>
          <DialogDescription>Escolha sua posição e confirme.</DialogDescription>
        </DialogHeader>
        <VoteOptions id="vote-dialog" value={option} onChange={onOptionChange} />
        <p className="m-0 flex items-start gap-2 text-[13px] text-muted-foreground">
          <LockIcon className="mt-0.5 size-3.5 shrink-0" />
          Seu voto é sigiloso e não pode ser alterado depois.
        </p>
        <DialogFooter>
          <Button variant="outline" disabled={submitting} onClick={onClose}>
            Voltar
          </Button>
          <Button disabled={!option || submitting} onClick={onConfirm}>
            {submitting && <Spinner />}
            {submitting ? 'Registrando…' : 'Confirmar voto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
