import { createFileRoute } from '@tanstack/react-router'

import { requireStaff } from '@/lib/auth/guards'
import { Admin } from '@/pages/admin'

export const Route = createFileRoute('/_autenticado/admin')({
  beforeLoad: requireStaff,
  component: Admin,
})
