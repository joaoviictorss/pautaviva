import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { toast } from '@/components/ui/toast'
import { api, ApiError } from '@/lib/api/client'
import { formField } from '@/lib/form/field'

import { CreateUserDialog as Layout } from './layout'
import type { CreateUserDialogLayoutProps, CreateUserDialogProps, CreateUserRoleOption } from './data'

const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .refine((v) => v.split(/\s+/).length >= 2, 'Informe nome e sobrenome.'),
  email: z.string().trim().pipe(z.email('Informe um e-mail válido.')),
  role: z.enum(['MANAGER', 'MODERATOR']),
})

type CreateUserValues = z.infer<typeof createUserSchema>

const ROLES: CreateUserRoleOption[] = [
  { value: 'MANAGER', label: 'Gestor público', description: 'Cadastra e edita pautas, exporta resultados.' },
  { value: 'MODERATOR', label: 'Moderador', description: 'Aprova, rejeita e remove comentários.' },
]

export function CreateUserDialog({ onCreated }: CreateUserDialogProps) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const form = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: '', email: '', role: 'MANAGER' },
  })

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) form.reset()
  }

  const onSubmit = form.handleSubmit(async (values) => {
    const email = values.email.trim().toLowerCase()
    try {
      await api('/admin/users', { method: 'POST', json: { ...values, email } })
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        toast.add({
          type: 'error',
          title: err.message,
          description: 'Você pode alterar o perfil dessa conta na lista.',
          actionProps: {
            children: 'Alterar perfil',
            onClick: () => {
              handleOpenChange(false)
              navigate({ to: '/admin/usuarios', search: { q: email } })
            },
          },
        })
        return
      }
      toast.add({ type: 'error', title: 'Não foi possível cadastrar', description: (err as Error).message })
      return
    }

    toast.add({ type: 'success', title: 'Convite enviado', description: `${email} recebeu o link para definir a senha.` })
    handleOpenChange(false)
    onCreated()
  })

  const role = form.watch('role')

  const layoutProps: CreateUserDialogLayoutProps = {
    onCreated,
    open,
    onOpenChange: handleOpenChange,
    name: formField(form, 'name'),
    email: formField(form, 'email'),
    role,
    onRoleChange: (value) => form.setValue('role', value),
    roleOptions: ROLES,
    loading: form.formState.isSubmitting,
    onSubmit,
  }

  return <Layout {...layoutProps} />
}
