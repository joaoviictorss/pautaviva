import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_autenticado/admin/')({
  beforeLoad: () => {
    throw redirect({ to: '/admin/pautas' })
  },
})
