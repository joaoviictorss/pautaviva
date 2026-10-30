import { createFileRoute } from '@tanstack/react-router'

import { AdminPauta } from '@/pages/admin-pauta'

export const Route = createFileRoute('/_autenticado/admin/pautas_/$pollId')({
  component: AdminPauta,
})
