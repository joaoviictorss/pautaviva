import { Link } from '@tanstack/react-router'
import { ArrowRightIcon, CheckCheckIcon, CircleAlertIcon, DownloadIcon, LockIcon, MessageCircleIcon, PencilIcon, Trash2Icon } from 'lucide-react'

import { FilterChips } from '@/components/filter-chips'
import { PageHeader } from '@/components/page-header'
import { ParticipationRowLink } from '@/components/poll-rows'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'

import type { MinhaParticipacaoLayoutProps } from '../data'

const PILL = 'h-10 rounded-full px-5 font-semibold'

export function MinhaParticipacao({
  tabs,
  tab,
  months,
  comments,
  total,
  page,
  pageSize,
  editingId,
  editingText,
  deletingId,
  saving,
  downloading,
  loading,
  error,
  onTabChange,
  onPageChange,
  onEdit,
  onEditingTextChange,
  onCancelEdit,
  onResubmit,
  onAskDelete,
  onDelete,
  onDownload,
}: MinhaParticipacaoLayoutProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <section className="flex animate-[word-in_.35s_cubic-bezier(.16,1,.3,1)] flex-col gap-6">
      <PageHeader title="Minhas participações" description="Seu histórico de votos e comentários.">
        <Button variant="outline" disabled={downloading || total === 0} className={`${PILL} bg-card`} onClick={onDownload}>
          <DownloadIcon />
          {downloading ? 'Gerando...' : 'Baixar meu histórico'}
        </Button>
      </PageHeader>

      <FilterChips label="Tipo de participação" chips={tabs} value={tab} onChange={onTabChange} />

      {error ? (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertTitle>Não foi possível carregar sua participação</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : loading ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : tab === 'votos' ? (
        <>
          <p className="m-0 inline-flex items-center gap-2 text-[13px] text-muted-foreground">
            <LockIcon className="size-3.5 shrink-0" />
            Seu voto é secreto: guardamos apenas que você participou, nunca a opção escolhida.
          </p>
          {months.length ? (
            months.map((month) => (
              <Card key={month.label} className="@container gap-1.5 rounded-2xl px-5 pt-5 pb-2.5">
                <h2 className="m-0 pb-2 text-[15px] font-bold tracking-tight first-letter:uppercase">{month.label}</h2>
                {month.items.map((item) => (
                  <ParticipationRowLink key={item.id} item={item} />
                ))}
              </Card>
            ))
          ) : (
            <Empty className="rounded-2xl border border-dashed">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CheckCheckIcon />
                </EmptyMedia>
                <EmptyTitle>Sua participação começa com uma pauta</EmptyTitle>
                <EmptyDescription>Você ainda não votou. Explore as pautas abertas.</EmptyDescription>
              </EmptyHeader>
              <Button nativeButton={false} render={<Link to="/pautas" search={{ status: 'OPEN' }} />} className={PILL}>
                Explorar pautas abertas
                <ArrowRightIcon />
              </Button>
            </Empty>
          )}

          {totalPages > 1 && (
            <nav aria-label="Paginação do histórico" className="flex items-center justify-between gap-3">
              <p className="m-0 text-sm text-muted-foreground">
                Página {page} de {totalPages} · {total} {total === 1 ? 'participação' : 'participações'}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
                  Anterior
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
                  Próxima
                </Button>
              </div>
            </nav>
          )}
        </>
      ) : comments.length ? (
        <div className="flex flex-col gap-3">
          {comments.map((comment) => (
            <Card key={comment.id} className="gap-2.5 rounded-2xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link to="/pautas/$pollId" params={{ pollId: comment.pollId }} className="min-w-0 font-bold tracking-tight text-foreground no-underline hover:underline">
                  {comment.pollTitle}
                </Link>
                <Badge className={`h-6 px-2.5 font-semibold ${comment.statusClassName}`}>{comment.statusLabel}</Badge>
              </div>
              <span className="text-xs text-muted-foreground">{comment.dateLabel}</span>
              {editingId === comment.id ? (
                <div className="flex flex-col gap-2">
                  <Textarea
                    aria-label="Editar comentário"
                    maxLength={1000}
                    value={editingText}
                    disabled={saving}
                    onChange={(event) => onEditingTextChange(event.target.value)}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">{editingText.length}/1000</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={saving} onClick={onCancelEdit}>Cancelar</Button>
                      <Button size="sm" disabled={saving || editingText.trim().length < 5} onClick={onResubmit}>
                        {saving ? 'Reenviando...' : 'Reenviar para moderação'}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="m-0 text-sm leading-relaxed whitespace-pre-wrap">{comment.text}</p>
              )}
              {comment.rejectionReason && (
                <p className="m-0 rounded-xl bg-muted/60 px-3 py-2 text-[13px] text-muted-foreground">
                  <strong className="font-semibold">Motivo:</strong> {comment.rejectionReason}
                </p>
              )}
              {editingId !== comment.id && (comment.canResubmit || comment.canDelete) && (
                <div className="flex flex-wrap gap-1">
                  {comment.canResubmit && (
                    <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => onEdit(comment)}>
                      <PencilIcon />
                      Editar e reenviar
                    </Button>
                  )}
                  {comment.canDelete && (
                    <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => onAskDelete(comment.id)}>
                      <Trash2Icon />
                      Excluir
                    </Button>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Empty className="rounded-2xl border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MessageCircleIcon />
            </EmptyMedia>
            <EmptyTitle>Nenhum comentário ainda</EmptyTitle>
            <EmptyDescription>Seus comentários e o andamento da moderação aparecem aqui.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && onAskDelete(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir comentário?</AlertDialogTitle>
            <AlertDialogDescription>Ele deixa de aparecer na pauta e não poderá ser recuperado por você.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={saving} onClick={onDelete}>
              {saving ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
