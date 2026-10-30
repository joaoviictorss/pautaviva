import { createFileRoute } from '@tanstack/react-router'

import { requireCitizen } from '@/lib/auth/guards'
import { Painel } from '@/pages/painel'

export const Route = createFileRoute('/_comunidade/_autenticado/painel')({
  beforeLoad: requireCitizen,
  component: Painel,
})
