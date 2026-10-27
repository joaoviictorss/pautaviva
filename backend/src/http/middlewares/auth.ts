import { fromNodeHeaders } from 'better-auth/node'
import type { FastifyInstance } from 'fastify'
import type { Role } from '@prisma/client'
import fastifyPlugin from 'fastify-plugin'

import { auth } from '../../lib/auth.js'
import { ForbiddenError } from '../routes/_errors/forbidden-error.js'
import { UnauthorizedError } from '../routes/_errors/unauthorized-error.js'

export const authPlugin = fastifyPlugin(async (app: FastifyInstance) => {
  app.addHook('preHandler', async (request) => {
    request.getCurrentUser = async () => {
      const result = await auth.api.getSession({
        headers: fromNodeHeaders(request.headers),
      })

      if (!result) {
        throw new UnauthorizedError('Sessão inválida ou expirada.')
      }

      return result.user
    }

    request.getCurrentUserId = async () => {
      const user = await request.getCurrentUser()

      return user.id
    }

    request.requireRole = async (...roles) => {
      const user = await request.getCurrentUser()

      if (!roles.includes(user.role as Role)) {
        throw new ForbiddenError('Você não tem permissão para esta ação.')
      }

      return user
    }
  })
})
