import type { FastifyInstance } from 'fastify'

import { prisma } from '../../lib/prisma.js'
import { NotFoundError } from './_errors/not-found-error.js'

export async function userRoutes(app: FastifyInstance) {
  app.get('/users/me', async (request) => {
    const user = await request.getCurrentUser()
    const [profile, pollsCreated, pollsVoted] = await Promise.all([
      prisma.users.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          image: true,
          cpf: true,
          role: true,
          createdAt: true,
        },
      }),
      prisma.polls.count({ where: { createdById: user.id } }),
      prisma.participations.count({ where: { userId: user.id } }),
    ])

    if (!profile) throw new NotFoundError('Usuário não encontrado.')

    return { ...profile, pollsCreated, pollsVoted }
  })
}
