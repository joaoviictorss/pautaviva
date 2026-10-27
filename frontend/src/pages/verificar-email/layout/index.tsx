import { ArrowLeftIcon } from 'lucide-react'

import { AuthMessage } from '@/components/auth-message'
import { AuthShell } from '@/components/auth-shell'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'

import type { VerificarEmailExpiredView, VerificarEmailLayoutProps } from '../data'

function VerificarEmailExpired({ title, email, loading, onSubmit, onBack }: VerificarEmailExpiredView) {
  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex animate-[word-in_.4s_cubic-bezier(.16,1,.3,1)] flex-col gap-5"
    >
      <div className="flex flex-col gap-2">
        <h1 className="m-0 text-3xl font-bold tracking-tight text-balance">{title}</h1>
        <p className="m-0 text-[15px] leading-relaxed text-pretty text-muted-foreground">
          Por segurança, o link vale por tempo limitado. Confirme seu e-mail e enviaremos um novo.
        </p>
      </div>

      <Field>
        <FieldLabel htmlFor="v-email">E-mail</FieldLabel>
        <Input
          id="v-email"
          type="email"
          autoComplete="email"
          placeholder="voce@email.com"
          aria-invalid={!!email.error}
          {...email.register}
        />
        <FieldError>{email.error}</FieldError>
      </Field>

      <Button type="submit" disabled={loading} className="h-11 font-semibold">
        {loading && <Spinner />}
        Reenviar e-mail de confirmação
      </Button>

      <Button
        type="button"
        variant="link"
        onClick={onBack}
        className="self-center text-muted-foreground hover:text-foreground hover:no-underline"
      >
        <ArrowLeftIcon />
        Voltar para o login
      </Button>
    </form>
  )
}

export function VerificarEmail(props: VerificarEmailLayoutProps) {
  return (
    <AuthShell>
      {props.view === 'expired' ? <VerificarEmailExpired {...props} /> : <AuthMessage key={props.message.title} {...props.message} />}
    </AuthShell>
  )
}
