import { Link } from '@tanstack/react-router'
import { CircleAlertIcon, MessageCircleIcon } from 'lucide-react'

import { PageHeader } from '@/components/page-header'
import { PollCard } from '@/components/poll-card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'

import type { DiscussoesLayoutProps } from '../data'

const GRID = 'grid grid-cols-[repeat(auto-fill,minmax(min(100%,310px),1fr))] gap-4'

export function Discussoes({ polls, loading, error }: DiscussoesLayoutProps) {
  return (
    <section className="flex animate-[word-in_.35s_cubic-bezier(.16,1,.3,1)] flex-col gap-6">
      <PageHeader
        title="Discussões"
        description="Participe da conversa nas pautas abertas. Comentários passam por moderação antes de serem publicados."
      />

      {error ? (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : loading ? (
        <div className={GRID}>
          {Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-56 rounded-2xl" />)}
        </div>
      ) : polls.length ? (
        <div className={GRID}>
          {polls.map((poll) => (
            <PollCard key={poll.id} poll={poll} citizen linkTo="/pautas/$pollId" />
          ))}
        </div>
      ) : (
        <Empty className="rounded-2xl border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon"><MessageCircleIcon /></EmptyMedia>
            <EmptyTitle>Nenhuma discussão aberta</EmptyTitle>
            <EmptyDescription>Quando houver pautas abertas, você poderá comentar em seus detalhes.</EmptyDescription>
          </EmptyHeader>
          <Button nativeButton={false} render={<Link to="/pautas" />} variant="outline" className="rounded-full">Consultar pautas</Button>
        </Empty>
      )}
    </section>
  )
}
