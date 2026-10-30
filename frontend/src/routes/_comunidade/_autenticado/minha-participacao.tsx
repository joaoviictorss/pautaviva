import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { requireCitizen } from '@/lib/auth/guards'
import { MinhaParticipacao } from '@/pages/minha-participacao'

export const Route = createFileRoute('/_comunidade/_autenticado/minha-participacao')({
  validateSearch: z.object({
    tab: z.enum(['votos', 'comentarios']).optional().catch(undefined),
    page: z.coerce.number().int().positive().optional(),
  }),
  beforeLoad: requireCitizen,
  component: MinhaParticipacao,
})
