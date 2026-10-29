import { Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowRightIcon, MessageCircleIcon } from 'lucide-react'

import { CommunityNavigation } from '@/components/community-navigation'
import { SiteHeader } from '@/components/site-header'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { POLL_STATUS } from '@/lib/poll/status'

import type { DiscussoesLayoutProps } from '../data'

export function Discussoes({ polls, loading, error }: DiscussoesLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <CommunityNavigation active="discussoes">
        <header className="flex flex-col gap-2">
          <h1 className="m-0 text-3xl font-bold tracking-tight">Discussões</h1>
          <p className="m-0 text-muted-foreground">
            Participe da conversa nas pautas abertas. Comentários passam por moderação antes de serem publicados.
          </p>
        </header>

        {error ? (
          <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
        ) : loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-48 rounded-2xl" />)}
          </div>
        ) : polls.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {polls.map((poll) => (
              <Card key={poll.id} className="rounded-2xl">
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{poll.category.name}</Badge>
                    <Badge className={POLL_STATUS[poll.status].className}>{POLL_STATUS[poll.status].label}</Badge>
                  </div>
                  <CardTitle className="text-xl">{poll.title}</CardTitle>
                  <CardDescription className="line-clamp-3">{poll.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">
                    Até {format(new Date(poll.endsAt), "dd 'de' MMMM", { locale: ptBR })}
                  </span>
                  <Button nativeButton={false} render={<Link to="/pautas/$pollId" params={{ pollId: poll.id }} />} size="sm">
                    Abrir discussão
                    <ArrowRightIcon />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Empty className="rounded-2xl border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon"><MessageCircleIcon /></EmptyMedia>
              <EmptyTitle>Nenhuma discussão aberta</EmptyTitle>
              <EmptyDescription>Quando houver pautas abertas, você poderá comentar em seus detalhes.</EmptyDescription>
            </EmptyHeader>
            <Button nativeButton={false} render={<Link to="/pautas" />} variant="outline">Consultar pautas</Button>
          </Empty>
        )}
      </CommunityNavigation>
    </div>
  )
}
