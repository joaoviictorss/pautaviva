import type { LucideIcon } from 'lucide-react'

export interface AdminNavItem {
  to: '/admin' | '/admin/pautas' | '/admin/usuarios' | '/admin/moderacao'
  label: string
  icon: LucideIcon
}

export interface AdminProps {}

export interface AdminLayoutProps extends AdminProps {
  name: string
  email: string
  initials: string
  image?: string
  roleLabel: string
  nav: AdminNavItem[]
  search: string
  searchPlaceholder: string
  onSearchChange: (value: string) => void
  signingOut: boolean
  onSignOut: () => void
}
