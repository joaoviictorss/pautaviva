import type { LucideIcon } from 'lucide-react'

export interface AppShellNavItem {
  to:
    | '/admin'
    | '/admin/pautas'
    | '/admin/usuarios'
    | '/admin/moderacao'
    | '/painel'
    | '/pautas'
    | '/discussoes'
    | '/agenda'
    | '/minha-participacao'
    | '/configuracoes'
  label: string
  icon: LucideIcon
}

export interface AppShellUser {
  name: string
  email: string
  initials: string
  image: string
  roleLabel: string
}

export interface AppShellProps {}

export interface AppShellLayoutProps extends AppShellProps {
  homeTo: '/' | '/painel' | '/admin'
  /** Ausente para visitantes, que veem Entrar e Criar conta. */
  user?: AppShellUser
  loading: boolean
  nav: AppShellNavItem[]
  navLabel: string
  search: string
  searchPlaceholder: string
  onSearchChange: (value: string) => void
  signingOut: boolean
  onSignOut: () => void
}
