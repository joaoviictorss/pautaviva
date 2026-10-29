import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { requireCitizen } from '@/lib/auth/guards'
import { MinhaParticipacao } from '@/pages/minha-participacao'

export const Route = createFileRoute('/_autenticado/minha-participacao')({
  validateSearch: z.object({
    page: z.coerce.number().int().positive().optional(),
    from: z.enum(['painel', 'pautas']).optional(),
  }),
  beforeLoad: requireCitizen,
  component: MinhaParticipacao,
})
