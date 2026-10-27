import type { FilterChip } from '@/components/filter-chips/data'
import type { Role } from '@/lib/auth/roles'

export interface AdminUser {
  id: string
  name: string
  email: string
  image: string | null
  role: Role
  pending: boolean
  createdAt: string
}

export interface AdminUsersPage {
  users: AdminUser[]
  total: number
  pageSize: number
  countsByRole: Partial<Record<Role, number>>
}

export type RoleFilter = 'ALL' | Role

export interface AdminRoleOption {
  value: Role
  label: string
}

export interface AdminUserRow {
  id: string
  name: string
  email: string
  image?: string
  initials: string
  role: Role
  isSelf: boolean
  pending: boolean
  createdLabel: string
  updating: boolean
}

export interface AdminUsuariosProps {}

export interface AdminUsuariosLayoutProps extends AdminUsuariosProps {
  filters: FilterChip<RoleFilter>[]
  roleFilter: RoleFilter
  onRoleFilterChange: (value: RoleFilter) => void
  rows: AdminUserRow[]
  loading: boolean
  error?: string
  roleOptions: AdminRoleOption[]
  onRoleChange: (userId: string, role: Role) => void
  onUserCreated: () => void
  page: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
}
