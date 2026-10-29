import { createFileRoute } from '@tanstack/react-router'

import { Discussoes } from '@/pages/discussoes'

export const Route = createFileRoute('/discussoes')({
  component: Discussoes,
})
