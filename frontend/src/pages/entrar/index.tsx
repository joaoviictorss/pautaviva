import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { getRouteApi, useNavigate, useRouter } from '@tanstack/react-router'
import { useForm, useWatch } from 'react-hook-form'

import { toast } from '@/components/ui/toast'
import { useEmailSender } from '@/hooks/use-email-sender'
import { sendVerificationLink, signIn } from '@/lib/auth/client'
import { minutesUntil, type AuthError } from '@/lib/auth/errors'
import { signInSchema, type SignInValues } from '@/lib/auth/schemas'
import { formField } from '@/lib/form/field'

import { Entrar as Layout } from './layout'
import type { EntrarLayoutProps, EntrarProps } from './data'

const route = getRouteApi('/_visitante/entrar')

export function Entrar(_props: EntrarProps) {
  const navigate = useNavigate()
  const router = useRouter()
  const { redirect } = route.useSearch()
  const [view, setView] = useState<'form' | 'sent'>('form')
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null)
  const verification = useEmailSender(sendVerificationLink)

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  })

  async function resendConfirmation() {
    if (await verification.send(form.getValues('email').trim())) setView('sent')
  }

  const onSubmit = form.handleSubmit(async ({ email, password }) => {
    const { error } = await signIn.email({ email, password })

    if (!error) {
      if (redirect) router.history.push(redirect)
      else navigate({ to: '/painel' })
      return
    }

    const authError = error as AuthError

    if (authError.code === 'EMAIL_NOT_VERIFIED') {
      toast.add({
        type: 'warning',
        title: 'Cadastro ainda não confirmado',
        description: 'Confirme seu cadastro pelo e-mail enviado antes de acessar.',
        actionProps: { children: 'Reenviar e-mail de confirmação', onClick: resendConfirmation },
      })
      return
    }

    if (authError.code === 'ACCOUNT_LOCKED') {
      setAttemptsLeft(null)
      const minutes = minutesUntil(authError.lockedUntil)
      toast.add({
        type: 'error',
        title: 'Conta bloqueada temporariamente',
        description: `Foram 5 tentativas inválidas seguidas. Tente novamente em ${minutes} min, ou redefina sua senha.`,
        actionProps: { children: 'Redefinir senha', onClick: () => navigate({ to: '/esqueci-senha' }) },
      })
      return
    }

    if (authError.status === 429) {
      toast.add({
        type: 'error',
        title: 'Muitas tentativas a partir desta rede',
        description: 'Aguarde alguns instantes antes de tentar de novo.',
      })
      return
    }

    setAttemptsLeft(authError.attemptsLeft ?? null)
    toast.add({
      type: 'error',
      title: 'E-mail ou senha inválidos',
      description: 'Confira os dados e tente de novo.',
    })
  })

  const email = useWatch({ control: form.control, name: 'email' }).trim()

  let layoutProps: EntrarLayoutProps

  if (view === 'sent') {
    layoutProps = {
      view: 'sent',
      message: {
        title: 'Confirme seu e-mail',
        description: {
          before: 'Enviamos um link de confirmação para ',
          highlight: email,
          after: '. Seu cadastro é concluído assim que você clicar nele.',
        },
        primary: {
          label: verification.resendLabel,
          onClick: () => verification.send(email),
          disabled: verification.cooldownActive,
          loading: verification.sending,
        },
        back: { label: 'Voltar para o login', onClick: () => setView('form') },
      },
    }
  } else {
    layoutProps = {
      view: 'form',
      email: formField(form, 'email'),
      password: formField(form, 'password'),
      attemptsHint:
        attemptsLeft !== null && attemptsLeft <= 2
          ? `Restam ${attemptsLeft} ${attemptsLeft === 1 ? 'tentativa' : 'tentativas'} antes do bloqueio temporário.`
          : undefined,
      loading: form.formState.isSubmitting,
      onSubmit,
    }
  }

  return <Layout {...layoutProps} />
}
