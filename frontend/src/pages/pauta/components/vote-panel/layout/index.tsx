import { Link } from '@tanstack/react-router'
import { CalendarClockIcon, CircleCheckIcon, InfoIcon, LockIcon } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel, FieldTitle } from '@/components/ui/field'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import type { VoteOption } from '@/lib/poll/types'

import type { VotePanelLayoutProps } from '../data'

export function VotePanel({ poll, state, opensLabel, options, option, onOptionChange, submitting, onSubmit }: VotePanelLayoutProps) {
  return (
    <Card className="gap-4 rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg font-bold tracking-tight">Seu voto</CardTitle>
        <CardDescription>O voto é secreto: fica registrado só que você participou, não a opção escolhida.</CardDescription>
      </CardHeader>

      <CardContent>
        {state === 'loading' && <Skeleton className="h-40 rounded-xl" />}

        {state === 'vote' && (
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <RadioGroup
              aria-label="Opção de voto"
              value={option ?? null}
              onValueChange={(value) => onOptionChange(value as VoteOption)}
            >
              {options.map((item) => (
                <FieldLabel key={item.value} htmlFor={`vote-${item.value}`} className="rounded-xl!">
                  <Field orientation="horizontal" className="items-center">
                    <span className="size-3 shrink-0 rounded-[4px]" style={{ background: item.color }} />
                    <FieldTitle className="flex-1">{item.label}</FieldTitle>
                    <RadioGroupItem id={`vote-${item.value}`} value={item.value} />
                  </Field>
                </FieldLabel>
              ))}
            </RadioGroup>
            <Button type="submit" disabled={!option || submitting} className="h-11 rounded-full font-semibold">
              {submitting && <Spinner />}
              {submitting ? 'Registrando…' : 'Confirmar voto'}
            </Button>
          </form>
        )}

        {state === 'sign-in' && (
          <div className="flex flex-col gap-3">
            <p className="m-0 text-sm text-muted-foreground">Entre com a sua conta de cidadão para votar nesta pauta.</p>
            <Button
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
            <AlertTitle>Você já votou nesta pauta</AlertTitle>
            <AlertDescription>Acompanhe o resultado parcial ao lado.</AlertDescription>
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
          <Alert>
            <CalendarClockIcon />
            <AlertTitle>A votação ainda não começou</AlertTitle>
            <AlertDescription>Esta pauta abre para votação em {opensLabel}.</AlertDescription>
          </Alert>
        )}

        {state === 'closed' && (
          <Alert>
            <LockIcon />
            <AlertTitle>Votação encerrada</AlertTitle>
            <AlertDescription>Esta pauta não está mais disponível para votação.</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
