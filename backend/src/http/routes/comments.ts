import { Prisma } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { classifyComment } from '../../lib/comment-moderation.js'
import { prisma } from '../../lib/prisma.js'
import { BadRequestError } from './_errors/bad-request-error.js'
import { ConflictError } from './_errors/conflict-error.js'
import { NotFoundError } from './_errors/not-found-error.js'

const pollParams = z.object({ id: z.uuid() })
const commentParams = z.object({ id: z.uuid() })
const commentBody = z.object({ text: z.string().trim().min(5).max(1000) })

export async function commentRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>()

  api.get('/polls/:id/comments', { schema: { params: pollParams } }, async (request) => {
    const poll = await prisma.polls.findUnique({ where: { id: request.params.id }, select: { id: true } })
    if (!poll) throw new NotFoundError('Pauta não encontrada.')

    return prisma.comments.findMany({
      where: { pollId: poll.id, status: 'APPROVED' },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        text: true,
        createdAt: true,
        author: { select: { name: true, image: true } },
      },
    })
  })

  api.post(
    '/polls/:id/comments',
    { schema: { params: pollParams, body: commentBody } },
    async (request, reply) => {
      const user = await request.requireRole('CITIZEN')
      const poll = await prisma.polls.findUnique({ where: { id: request.params.id } })
      if (!poll) throw new NotFoundError('Pauta não encontrada.')
      const now = new Date()
      if (poll.status === 'CLOSED' || poll.startsAt > now || poll.endsAt <= now) {
        throw new BadRequestError('Esta pauta não está disponível para comentários no momento.')
      }

      let screening: Awaited<ReturnType<typeof classifyComment>> = null
      try {
        screening = await classifyComment(request.body.text)
      } catch (error) {
        request.log.error(error, 'falha na triagem automática de comentário; encaminhando para moderação humana')
      }

      if (screening?.classification === 'INAPPROPRIATE') {
        await prisma.auditLogs.create({
          data: {
            action: 'COMMENT_BLOCKED',
            actorId: user.id,
            targetId: poll.id,
            details: { classification: screening.classification, reason: screening.reason },
          },
        })
        throw new BadRequestError('Seu comentário contém conteúdo impróprio e não pôde ser enviado.')
      }

      const comment = await prisma.$transaction(async (transaction) => {
        const created = await transaction.comments.create({
          data: {
            text: request.body.text,
            pollId: poll.id,
            authorId: user.id,
            classification: screening?.classification,
            moderationReason: screening?.reason,
          },
          select: { id: true, status: true },
        })
        await transaction.auditLogs.create({
          data: {
            action: 'COMMENT_SUBMITTED',
            actorId: user.id,
            targetId: created.id,
            details: { pollId: poll.id, classification: screening?.classification ?? 'UNAVAILABLE' },
          },
        })
        return created
      })

      return reply.status(201).send(comment)
    },
  )

  api.get('/moderation/comments', async (request) => {
    await request.requireRole('MODERATOR', 'ADMIN')
    return prisma.comments.findMany({
      where: { status: 'PENDING' },
      orderBy: [{ classification: 'desc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        text: true,
        createdAt: true,
        classification: true,
        moderationReason: true,
        author: { select: { name: true } },
        poll: { select: { id: true, title: true } },
      },
    })
  })

  api.patch(
    '/moderation/comments/:id',
    {
      schema: {
        params: commentParams,
        body: z.object({ status: z.enum(['APPROVED', 'REJECTED']) }),
      },
    },
    async (request, reply) => {
      const moderator = await request.requireRole('MODERATOR', 'ADMIN')
      try {
        await prisma.$transaction(async (transaction) => {
          const result = await transaction.comments.updateMany({
            where: { id: request.params.id, status: 'PENDING' },
            data: { status: request.body.status, moderatedById: moderator.id },
          })
          if (result.count !== 1) throw new ConflictError('Este comentário já foi tratado ou não existe.')
          await transaction.auditLogs.create({
            data: {
              action: 'COMMENT_MODERATED',
              actorId: moderator.id,
              targetId: request.params.id,
              details: { status: request.body.status },
            },
          })
        })
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
          throw new ConflictError('Este comentário já foi tratado ou não existe.')
        }
        throw error
      }

      return reply.status(204).send()
    },
  )
}
