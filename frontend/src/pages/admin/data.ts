import type { LucideIcon } from 'lucide-react'

export interface AdminNavItem {
  to: '/admin/pautas' | '/admin/usuarios'
  label: string
  icon: LucideIcon
}

export interface AdminProps {}

export interface AdminLayoutProps extends AdminProps {
  name: string
  initials: string
  image?: string
  roleLabel: string
  nav: AdminNavItem[]
  search: string
  searchPlaceholder: string
  onSearchChange: (value: string) => void
}
