import type { Role } from '@prisma/client'
import 'fastify'

import type { auth } from '../lib/auth.js'

type AuthUser = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>['user']

declare module 'fastify' {
  export interface FastifyRequest {
    getCurrentUserId(): Promise<string>
    getCurrentUser(): Promise<AuthUser>
    requireRole(...roles: Role[]): Promise<AuthUser>
  }
}
