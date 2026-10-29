import { Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MessageCircleIcon, SendIcon } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { getInitials } from '@/lib/utils/format'

import type { CommentsLayoutProps } from '../data'

export function Comments({
  commentable,
  comments,
  text,
  loading,
  submitting,
  signedIn,
  canComment,
  error,
  notice,
  onTextChange,
  onSubmit,
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
                  {comment.author.image && <AvatarImage src={comment.author.image} alt="" />}
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
    </Card>
  )
}
