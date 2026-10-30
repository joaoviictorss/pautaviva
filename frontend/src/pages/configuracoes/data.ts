import type { Role } from '@/lib/auth/roles'

export interface ConfiguracoesProps {}

export interface UserSettings {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image: string | null
  cpf: string | null
  role: Role
  createdAt: string
  pollsCreated: number
  pollsVoted: number
}

export interface ConfiguracoesLayoutProps extends ConfiguracoesProps {
  user?: UserSettings
  loading: boolean
  error?: string
  onRetry: () => void
  savingPhoto: boolean
  photoError?: string
  onPhotoChange: (file: File) => void
  onRemovePhoto: () => void
  signingOut: boolean
  onSignOut: () => void
}
