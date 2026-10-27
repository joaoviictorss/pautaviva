import { ArrowLeftIcon } from 'lucide-react'

import { AuthMessage } from '@/components/auth-message'
import { AuthShell } from '@/components/auth-shell'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'

import type { EsqueciSenhaFormView, EsqueciSenhaLayoutProps } from '../data'

function EsqueciSenhaForm({ email, loading, onSubmit, onBack }: EsqueciSenhaFormView) {
  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex animate-[word-in_.4s_cubic-bezier(.16,1,.3,1)] flex-col gap-5"
    >
      <div className="flex flex-col gap-2">
        <h1 className="m-0 text-3xl font-bold tracking-tight">Esqueceu a senha?</h1>
        <p className="m-0 text-[15px] leading-relaxed text-muted-foreground">
          Informe o e-mail cadastrado e enviaremos um link para você criar uma nova senha.
        </p>
      </div>

      <Field>
        <FieldLabel htmlFor="r-email">E-mail</FieldLabel>
        <Input
          id="r-email"
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
        Enviar link de redefinição
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

export function EsqueciSenha(props: EsqueciSenhaLayoutProps) {
  return (
    <AuthShell>
      {props.view === 'form' ? <EsqueciSenhaForm {...props} /> : <AuthMessage key={props.message.title} {...props.message} />}
    </AuthShell>
  )
}
