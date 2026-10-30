import { Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FlagIcon, MessageCircleIcon, SendIcon } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { getDefaultAvatar } from '@/lib/utils/avatar'
import { getInitials } from '@/lib/utils/format'

import type { CommentReportReason, CommentsLayoutProps } from '../data'

const reportReasons: { value: CommentReportReason; label: string }[] = [
  { value: 'OFFENSIVE_CONTENT', label: 'Conteúdo ofensivo' },
  { value: 'SPAM', label: 'Spam' },
  { value: 'HATE_SPEECH', label: 'Discurso de ódio' },
  { value: 'OTHER', label: 'Outro' },
]

export function Comments({
  commentable,
  comments,
  text,
  loading,
  submitting,
  signedIn,
  canComment,
  reportOpen,
  reportReason,
  reporting,
  error,
  notice,
  onTextChange,
  onSubmit,
  onReportOpenChange,
  onReportReasonChange,
  onOpenReport,
  onReport,
}: CommentsLayoutProps) {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><MessageCircleIcon className="size-5" />Discussão</CardTitle>
        <CardDescription>Comentários publicados após aprovação da moderação.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        {notice && <Alert><AlertDescription>{notice}</AlertDescription></Alert>}

        {commentable && (
          canComment ? (
            <div className="flex flex-col items-end gap-2">
              <Textarea
                aria-label="Escreva um comentário"
                placeholder="Compartilhe sua opinião com respeito..."
                maxLength={1000}
                value={text}
                onChange={(event) => onTextChange(event.target.value)}
                disabled={submitting}
              />
              <div className="flex w-full items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">{text.length}/1000</span>
                <Button disabled={submitting || text.trim().length < 5} onClick={onSubmit}>
                  <SendIcon />
                  {submitting ? 'Enviando...' : 'Enviar para moderação'}
                </Button>
              </div>
            </div>
          ) : (
            <Alert>
              <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
                <span>{signedIn ? 'Somente cidadãos podem comentar nesta pauta.' : 'Entre com uma conta de cidadão para participar da discussão.'}</span>
                {!signedIn && (
                  <Button nativeButton={false} render={<Link to="/entrar" />} variant="outline" size="sm">Entrar</Button>
                )}
              </AlertDescription>
            </Alert>
          )
        )}

        {loading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : comments.length ? (
          <div className="flex flex-col gap-4">
            {comments.map((comment) => (
              <article key={comment.id} className="flex gap-3 border-t pt-4">
                <Avatar className="size-9 shrink-0">
                  <AvatarImage src={comment.author.image ?? getDefaultAvatar(comment.author.name)} alt="" />
                  <AvatarFallback>{getInitials(comment.author.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <span className="font-semibold">{comment.author.name}</span>
                    <time className="text-xs text-muted-foreground" dateTime={comment.createdAt}>
                      {format(new Date(comment.createdAt), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                    </time>
                  </div>
                  <p className="m-0 mt-1 whitespace-pre-wrap text-sm leading-relaxed">{comment.text}</p>
                  {canComment && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-8 px-2 text-muted-foreground"
                      onClick={() => onOpenReport(comment.id)}
                    >
                      <FlagIcon />
                      Denunciar
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Empty className="rounded-xl border border-dashed py-5">
            <EmptyHeader>
              <EmptyMedia variant="icon"><MessageCircleIcon /></EmptyMedia>
              <EmptyTitle>Nenhum comentário publicado</EmptyTitle>
              <EmptyDescription>
                {commentable ? 'Seja a primeira pessoa a contribuir com a conversa.' : 'Ainda não há comentários publicados para esta pauta.'}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
      <Dialog open={reportOpen} onOpenChange={onReportOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Denunciar comentário</DialogTitle>
            <DialogDescription>
              Selecione o motivo. A denúncia será analisada pela equipe de moderação.
            </DialogDescription>
          </DialogHeader>
          <Select
            value={reportReason}
            onValueChange={(value) => {
              const reason = reportReasons.find((item) => item.value === value)
              if (reason) onReportReasonChange(reason.value)
            }}
          >
            <SelectTrigger aria-label="Motivo da denúncia" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {reportReasons.map((reason) => (
                <SelectItem key={reason.value} value={reason.value}>
                  {reason.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" disabled={reporting} onClick={() => onReportOpenChange(false)}>
              Cancelar
            </Button>
            <Button disabled={reporting} onClick={onReport}>
              {reporting ? 'Enviando...' : 'Enviar denúncia'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
