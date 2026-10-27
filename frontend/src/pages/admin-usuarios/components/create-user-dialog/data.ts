import type { FormField } from '@/lib/form/field'

export interface CreateUserDialogProps {
  onCreated: () => void
}

export type CreateUserRole = 'MANAGER' | 'MODERATOR'

export interface CreateUserRoleOption {
  value: CreateUserRole
  label: string
  description: string
}

export interface CreateUserDialogLayoutProps extends CreateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  name: FormField
  email: FormField
  role: CreateUserRole
  onRoleChange: (role: CreateUserRole) => void
  roleOptions: CreateUserRoleOption[]
  loading: boolean
  onSubmit: (event?: React.BaseSyntheticEvent) => Promise<void>
}
