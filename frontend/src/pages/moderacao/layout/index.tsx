import { Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeftIcon, CircleAlertIcon, ShieldCheckIcon } from 'lucide-react'

import { SiteHeader } from '@/components/site-header'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'

import type { ModeracaoLayoutProps } from '../data'

const classificationLabels = {
  ADEQUATE: 'Adequado',
  SUSPECT: 'Suspeito',
  INAPPROPRIATE: 'Impróprio',
}

export function Moderacao({ comments, loading, error, processingId, onDecision }: ModeracaoLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
        <Button nativeButton={false} render={<Link to="/pautas" />} variant="link" className="w-fit px-0">
          <ArrowLeftIcon />
          Voltar às pautas
        </Button>
        <header className="flex flex-col gap-2">
          <h1 className="m-0 text-3xl font-bold tracking-tight">Fila de moderação</h1>
          <p className="m-0 text-muted-foreground">Revise comentários antes de publicá-los nas discussões.</p>
        </header>

        {error && <Alert variant="destructive"><CircleAlertIcon /><AlertDescription>{error}</AlertDescription></Alert>}
        {loading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-48 rounded-2xl" />)}
          </div>
        ) : error ? null : comments.length ? (
          <div className="flex flex-col gap-4">
            {comments.map((comment) => (
              <Card key={comment.id} className="rounded-2xl">
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-base">{comment.poll.title}</CardTitle>
                    <Badge variant={comment.classification === 'SUSPECT' ? 'destructive' : 'outline'}>
                      {comment.classification ? classificationLabels[comment.classification] : 'Triagem indisponível'}
                    </Badge>
                  </div>
                  <CardDescription>
                    {comment.author.name} · {format(new Date(comment.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <p className="m-0 whitespace-pre-wrap leading-relaxed">{comment.text}</p>
                  {comment.moderationReason && (
                    <p className="m-0 text-sm text-muted-foreground">Triagem automática: {comment.moderationReason}</p>
                  )}
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      variant="outline"
                      disabled={processingId === comment.id}
                      onClick={() => onDecision(comment.id, 'REJECTED')}
                    >
                      Rejeitar
                    </Button>
                    <Button
                      disabled={processingId === comment.id}
                      onClick={() => onDecision(comment.id, 'APPROVED')}
                    >
                      <ShieldCheckIcon />
                      Aprovar e publicar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Empty className="rounded-2xl border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon"><ShieldCheckIcon /></EmptyMedia>
              <EmptyTitle>Fila em dia</EmptyTitle>
              <EmptyDescription>Não há comentários aguardando análise.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </main>
    </div>
  )
}
