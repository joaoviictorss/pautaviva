import { redirect } from '@tanstack/react-router'

import { authClient } from './client'

async function getSession() {
  const { data } = await authClient.getSession()
  return data
}

/** beforeLoad das rotas que exigem login: sem sessão, volta pro /entrar. */
export async function requireAuth() {
  const session = await getSession()
  if (!session) throw redirect({ to: '/entrar' })
  return { session }
}

/** beforeLoad das telas de visitante (entrar, cadastro...): logado vai pro painel. */
export async function requireGuest() {
  if (await getSession()) throw redirect({ to: '/painel' })
}

/**
 * O link de confirmação volta pra /verificar-email: com `error` o link
 * falhou e a tela mostra o reenvio; sem `error` o Better Auth já confirmou e
 * logou (autoSignInAfterVerification), então segue direto pro painel.
 */
export async function redirectAfterVerification({ search }: { search: { error?: string } }) {
  if (search.error) return
  throw redirect({ to: (await getSession()) ? '/painel' : '/entrar' })
}

export const STAFF_ROLES = ['ADMIN', 'MANAGER', 'MODERATOR']

interface SessionContext {
  context: { session: { user: { role?: string | null } } }
}

/** beforeLoad da área administrativa: gestores, moderadores e administradores. */
export function requireStaff({ context }: SessionContext) {
  if (!STAFF_ROLES.includes(context.session.user.role ?? '')) throw redirect({ to: '/painel' })
}

/** beforeLoad das telas do cidadão: a equipe entra direto na área administrativa. */
export function requireCitizen({ context }: SessionContext) {
  if (STAFF_ROLES.includes(context.session.user.role ?? '')) throw redirect({ to: '/admin' })
}

/** beforeLoad das telas de usuários e moderação: o gestor volta para as pautas. */
export function requireModerator({ context }: SessionContext) {
  if (!['MODERATOR', 'ADMIN'].includes(context.session.user.role ?? '')) throw redirect({ to: '/admin/pautas' })
}
