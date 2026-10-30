import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { env } from '../../env.js'
import { sendNoticeMail } from '../../lib/mail.js'
import { prisma } from '../../lib/prisma.js'
import { NotFoundError } from './_errors/not-found-error.js'

const notificationsBody = z.object({
  notifyPollOpened: z.boolean().optional(),
  notifyPollClosing: z.boolean().optional(),
  notifyPollResult: z.boolean().optional(),
  notifyComments: z.boolean().optional(),
})

export async function userRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>()

  api.get('/users/me', async (request) => {
    const user = await request.getCurrentUser()
    const [profile, credential] = await Promise.all([
      prisma.users.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          cpf: true,
          role: true,
          notifyPollOpened: true,
          notifyPollClosing: true,
          notifyPollResult: true,
          notifyComments: true,
        },
      }),
      prisma.accounts.findFirst({ where: { userId: user.id, providerId: 'credential' }, select: { updatedAt: true } }),
    ])

    if (!profile) throw new NotFoundError('Usuário não encontrado.')

    return {
      ...profile,
      cpf: profile.cpf ? '***.***.***-**' : null,
      passwordChangedAt: credential?.updatedAt ?? null,
    }
  })

  api.patch('/users/me/notifications', { schema: { body: notificationsBody } }, async (request, reply) => {
    const user = await request.requireRole('CITIZEN')
    await prisma.users.update({ where: { id: user.id }, data: request.body })
    return reply.status(204).send()
  })

  api.delete('/users/me', async (request, reply) => {
    const user = await request.requireRole('CITIZEN')

    // Anonimiza em vez de apagar: o hash do CPF e as participações impedem votar de novo com um novo cadastro.
    await prisma.$transaction([
      prisma.commentReports.updateMany({
        where: { comment: { authorId: user.id }, status: 'PENDING' },
        data: { status: 'DISMISSED', reviewedAt: new Date() },
      }),
      prisma.comments.updateMany({
        where: { authorId: user.id },
        data: { status: 'REMOVED', text: '[comentário removido]', moderatedById: null, moderationReason: null },
      }),
      prisma.pollReminders.deleteMany({ where: { userId: user.id } }),
      prisma.sessions.deleteMany({ where: { userId: user.id } }),
      prisma.accounts.deleteMany({ where: { userId: user.id } }),
      prisma.users.update({
        where: { id: user.id },
        data: {
          name: 'Conta excluída',
          email: `excluida-${user.id}@pautaviva.invalid`,
          emailVerified: false,
          image: null,
          notifyPollOpened: false,
          notifyPollClosing: false,
          notifyPollResult: false,
          notifyComments: false,
        },
      }),
      prisma.auditLogs.create({ data: { action: 'ACCOUNT_DELETED', actorId: user.id, targetId: user.id } }),
    ])

    await sendNoticeMail(user.email, user.name, {
      subject: 'Sua conta foi excluída',
      intro: 'Sua conta na PautaViva foi excluída e seus dados pessoais foram removidos, como você pediu.',
      action: 'Acessar a PautaViva',
      url: env.CORS_ORIGIN,
      outro: 'Se você não fez esse pedido, responda a este e-mail.',
    }).catch((error: unknown) => request.log.error(error, 'falha ao enviar confirmação de exclusão de conta'))

    return reply.status(204).send()
  })
}
