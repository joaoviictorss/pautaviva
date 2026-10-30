import type { Role } from '@/lib/auth/roles'
import type { FormField } from '@/lib/form/field'

export interface ConfiguracoesProps {}

export type NotificationKey = 'notifyPollOpened' | 'notifyPollClosing' | 'notifyPollResult' | 'notifyComments'

export interface UserSettings extends Record<NotificationKey, boolean> {
  id: string
  name: string
  email: string
  image: string | null
  cpf: string | null
  role: Role
  passwordChangedAt: string | null
}

export interface ProfileDraft {
  name: string
  email: string
  image: string | null
}

export interface NotificationItem {
  key: NotificationKey
  label: string
  description: string
  enabled: boolean
}

export interface PasswordDraft {
  current: string
  next: string
  confirmation: string
}

export interface PasswordFieldItem {
  id: string
  label: string
  autoComplete: 'current-password' | 'new-password'
  field: FormField
}

export interface ConfiguracoesLayoutProps extends ConfiguracoesProps {
  user?: UserSettings
  citizen: boolean
  loading: boolean
  error?: string
  onRetry: () => void
  draft?: ProfileDraft
  profileErrors: { name?: string; email?: string }
  avatarSrc: string
  gallery: string[]
  galleryOpen: boolean
  uploadError?: string
  dirty: boolean
  emailChanged: boolean
  savingProfile: boolean
  onDraftChange: (values: Partial<ProfileDraft>) => void
  onToggleGallery: () => void
  onUpload: (file: File) => void
  onDiscard: () => void
  onSaveProfile: (event: React.FormEvent) => void
  notifications: NotificationItem[]
  onNotificationChange: (key: NotificationKey, enabled: boolean) => void
  passwordFields: PasswordFieldItem[]
  passwordRules: { label: string; met: boolean }[]
  passwordAgeLabel?: string
  savingPassword: boolean
  onSavePassword: (event: React.FormEvent) => void
  exporting: boolean
  onExport: () => void
  deleteOpen: boolean
  deleteText: string
  deleting: boolean
  onDeleteOpenChange: (open: boolean) => void
  onDeleteTextChange: (text: string) => void
  onDelete: (event: React.FormEvent) => void
}
