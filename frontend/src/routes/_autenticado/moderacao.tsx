import { createFileRoute } from '@tanstack/react-router'

import { requireModerator } from '@/lib/auth/guards'
import { Moderacao } from '@/pages/moderacao'

export const Route = createFileRoute('/_autenticado/moderacao')({
  beforeLoad: requireModerator,
  component: Moderacao,
})
