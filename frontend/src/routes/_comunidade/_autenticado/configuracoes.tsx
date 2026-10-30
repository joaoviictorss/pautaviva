import { createFileRoute } from '@tanstack/react-router'

import { Configuracoes } from '@/pages/configuracoes'

export const Route = createFileRoute('/_comunidade/_autenticado/configuracoes')({
  component: Configuracoes,
})
