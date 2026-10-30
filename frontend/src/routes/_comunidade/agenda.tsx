import { createFileRoute } from '@tanstack/react-router'

import { Agenda } from '@/pages/agenda'

export const Route = createFileRoute('/_comunidade/agenda')({
  component: Agenda,
})
