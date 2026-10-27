export type Role = 'CITIZEN' | 'MANAGER' | 'MODERATOR' | 'ADMIN'

export const ROLE_LABELS: Record<Role, string> = {
  CITIZEN: 'Cidadão',
  MANAGER: 'Gestor público',
  MODERATOR: 'Moderador',
  ADMIN: 'Administrador',
}

export function roleLabel(role: string | null | undefined) {
  return ROLE_LABELS[role as Role] ?? ROLE_LABELS.CITIZEN
}
