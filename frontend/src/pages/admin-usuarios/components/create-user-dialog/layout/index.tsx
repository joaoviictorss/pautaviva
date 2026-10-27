import { UserPlusIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel, FieldTitle } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Spinner } from '@/components/ui/spinner'

import type { CreateUserDialogLayoutProps } from '../data'

export function CreateUserDialog({ open, onOpenChange, name, email, role, onRoleChange, roleOptions, loading, onSubmit }: CreateUserDialogLayoutProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button className="h-11 rounded-full pr-4.5 pl-3.5 font-semibold" />}>
        <UserPlusIcon />
        Cadastrar gestor ou moderador
      </DialogTrigger>

      <DialogContent className="rounded-3xl p-6 sm:max-w-110">
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4.5">
          <DialogHeader className="gap-1.5 pr-8">
            <DialogTitle className="text-[22px] font-bold tracking-tight">Cadastrar gestor ou moderador</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              A pessoa recebe um link por e-mail para definir a senha.
            </DialogDescription>
          </DialogHeader>

          <Field>
            <FieldLabel htmlFor="i-name">Nome completo</FieldLabel>
            <Input
              id="i-name"
              autoComplete="off"
              placeholder="Paulo Henrique"
              aria-invalid={!!name.error}
              className="h-11"
              {...name.register}
            />
            <FieldError>{name.error}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="i-email">E-mail</FieldLabel>
            <Input
              id="i-email"
              type="email"
              autoComplete="off"
              placeholder="nome@prefeitura.gov.br"
              aria-invalid={!!email.error}
              className="h-11"
              {...email.register}
            />
            <FieldError>{email.error}</FieldError>
          </Field>

          <Field>
            <FieldLabel id="i-role-label">Perfil</FieldLabel>
            <RadioGroup
              aria-labelledby="i-role-label"
              value={role}
              onValueChange={(value) => onRoleChange(value as typeof role)}
              className="grid-cols-2"
            >
              {roleOptions.map((option) => (
                <FieldLabel key={option.value} htmlFor={`i-role-${option.value}`} className="rounded-xl!">
                  <Field orientation="horizontal" className="items-start">
                    <FieldContent>
                      <FieldTitle>{option.label}</FieldTitle>
                      <FieldDescription className="text-xs leading-snug">{option.description}</FieldDescription>
                    </FieldContent>
                    <RadioGroupItem id={`i-role-${option.value}`} value={option.value} />
                  </Field>
                </FieldLabel>
              ))}
            </RadioGroup>
          </Field>

          <div className="flex justify-end gap-2.5 pt-1">
            <DialogClose render={<Button variant="outline" type="button" className="h-11 rounded-full px-4.5" />}>
              Cancelar
            </DialogClose>
            <Button type="submit" disabled={loading} className="h-11 rounded-full px-5 font-semibold">
              {loading && <Spinner />}
              {loading ? 'Enviando…' : 'Enviar convite'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
