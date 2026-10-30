import { Link } from '@tanstack/react-router'
import { BellIcon, BellRingIcon, CalendarClockIcon, CircleCheckIcon, InfoIcon, LockIcon } from 'lucide-react'

import { PollOutcome } from '@/components/poll-outcome'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { VoteOptions } from '@/components/vote-options'
import { POLL_STATUS } from '@/lib/poll/status'

import type { VotePanelLayoutProps, VotePanelState } from '../data'

const TITLES: Record<VotePanelState, string> = {
  loading: 'Qual sua posição?',
  vote: 'Qual sua posição?',
  'sign-in': 'Qual sua posição?',
  'not-citizen': 'Qual sua posição?',
  voted: 'Você já votou',
  scheduled: 'Votação em breve',
  closed: 'Resultado',
}

export function VotePanel({
  poll,
  state,
  opensLabel,
  reminder,
  option,
  onOptionChange,
  submitting,
  onSubmit,
  onToggleReminder,
}: VotePanelLayoutProps) {
  return (
    <Card className="gap-4 rounded-2xl p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="m-0 text-[17px] font-bold tracking-tight">{TITLES[state]}</h2>
        {poll.status === 'OPEN' && <Badge className={`h-6 px-2.5 font-semibold ${POLL_STATUS.OPEN.className}`}>{POLL_STATUS.OPEN.label}</Badge>}
      </div>

      {state === 'loading' && <Skeleton className="h-40 rounded-xl" />}

      {state === 'vote' && (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <VoteOptions id="vote" value={option} onChange={onOptionChange} />
          <Button type="submit" disabled={!option || submitting} className="h-11 rounded-full font-semibold">
            {submitting && <Spinner />}
            {submitting ? 'Registrando…' : 'Confirmar voto'}
          </Button>
          <p className="m-0 flex items-start gap-2 text-[13px] text-muted-foreground">
            <LockIcon className="mt-0.5 size-3.5 shrink-0" />
            Um voto por CPF. O voto é sigiloso e não pode ser alterado depois.
          </p>
        </form>
      )}

      {state === 'sign-in' && (
        <div className="flex flex-col gap-3">
          <p className="m-0 text-sm text-muted-foreground">Entre com a sua conta de cidadão para votar nesta pauta.</p>
          <Button
            nativeButton={false}
            render={<Link to="/entrar" search={{ redirect: `/pautas/${poll.id}` }} />}
            className="h-11 rounded-full font-semibold"
          >
            Entrar para votar
          </Button>
        </div>
      )}

      {state === 'voted' && (
        <Alert>
          <CircleCheckIcon />
          <AlertTitle>Participação registrada</AlertTitle>
          <AlertDescription>Seu voto é sigiloso. Acompanhe o resultado parcial ao vivo nesta página.</AlertDescription>
        </Alert>
      )}

      {state === 'not-citizen' && (
        <Alert>
          <InfoIcon />
          <AlertTitle>Votação exclusiva para cidadãos</AlertTitle>
          <AlertDescription>Contas de gestão e moderação não votam nas pautas.</AlertDescription>
        </Alert>
      )}

      {state === 'scheduled' && (
        <div className="flex flex-col gap-3">
          <p className="m-0 flex items-start gap-2 text-sm text-muted-foreground">
            <CalendarClockIcon className="mt-0.5 size-4 shrink-0" />
            Esta pauta abre para votação em {opensLabel}.
          </p>
          {reminder === 'toggle' && (
            <Button variant={poll.hasReminder ? 'secondary' : 'default'} className="h-11 rounded-full font-semibold" onClick={onToggleReminder}>
              {poll.hasReminder ? <BellRingIcon /> : <BellIcon />}
              {poll.hasReminder ? 'Lembrete ativo' : 'Lembrar-me'}
            </Button>
          )}
          {reminder === 'sign-in' && (
            <Button
              nativeButton={false}
              render={<Link to="/entrar" search={{ redirect: `/pautas/${poll.id}` }} />}
              className="h-11 rounded-full font-semibold"
            >
              <BellIcon />
              Lembrar-me
            </Button>
          )}
          {reminder && <p className="m-0 text-[13px] text-muted-foreground">Ative o lembrete e avisamos por e-mail quando a votação começar.</p>}
        </div>
      )}

      {state === 'closed' && (
        <div className="flex flex-col gap-1.5">
          <PollOutcome results={poll.results} />
          <p className="m-0 text-sm text-muted-foreground">Esta pauta não está mais disponível para votação.</p>
        </div>
      )}
    </Card>
  )
}
