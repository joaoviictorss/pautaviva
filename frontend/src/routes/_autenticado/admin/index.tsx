import { createFileRoute } from '@tanstack/react-router'

import { AdminInicio } from '@/pages/admin-inicio'

export const Route = createFileRoute('/_autenticado/admin/')({
  component: AdminInicio,
})
