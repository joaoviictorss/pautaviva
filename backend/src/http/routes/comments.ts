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
const reportBody = z.object({
  reason: z.enum(['OFFENSIVE_CONTENT', 'SPAM', 'HATE_SPEECH', 'OTHER']),
})

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

  api.post(
    '/comments/:id/reports',
    { schema: { params: commentParams, body: reportBody } },
    async (request, reply) => {
      const user = await request.requireRole('CITIZEN')
      const comment = await prisma.comments.findUnique({
        where: { id: request.params.id },
        select: { id: true, authorId: true, status: true },
      })
      if (!comment) throw new NotFoundError('Comentário não encontrado.')
      if (comment.status !== 'APPROVED') {
        throw new BadRequestError('Só é possível denunciar comentários publicados.')
      }
      if (comment.authorId === user.id) {
        throw new BadRequestError('Você não pode denunciar o próprio comentário.')
      }

      try {
        await prisma.$transaction(async (transaction) => {
          await transaction.commentReports.create({
            data: { commentId: comment.id, reporterId: user.id, reason: request.body.reason },
          })
          await transaction.auditLogs.create({
            data: {
              action: 'COMMENT_REPORTED',
              actorId: user.id,
              targetId: comment.id,
              details: { reason: request.body.reason },
            },
          })
        })
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          throw new ConflictError('Você já denunciou este comentário.')
        }
        throw error
      }

      return reply.status(201).send()
    },
  )

  api.get('/moderation/comments', async (request) => {
    await request.requireRole('MODERATOR', 'ADMIN')
    return prisma.comments.findMany({
      where: {
        OR: [{ status: 'PENDING' }, { reports: { some: { status: 'PENDING' } } }],
      },
      orderBy: [{ classification: 'desc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        text: true,
        createdAt: true,
        status: true,
        classification: true,
        moderationReason: true,
        author: { select: { name: true, image: true } },
        poll: { select: { id: true, title: true } },
        reports: {
          where: { status: 'PENDING' },
          orderBy: { createdAt: 'asc' },
          select: { reason: true, createdAt: true },
        },
      },
    })
  })

  api.get('/moderation/comments/history', async (request) => {
    await request.requireRole('MODERATOR', 'ADMIN')
    return prisma.comments.findMany({
      where: { moderatedById: { not: null } },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        text: true,
        updatedAt: true,
        status: true,
        moderationReason: true,
        author: { select: { name: true, image: true } },
        moderatedBy: { select: { name: true } },
        poll: { select: { id: true, title: true } },
      },
    })
  })

  api.patch(
    '/moderation/comments/:id',
    {
      schema: {
        params: commentParams,
        body: z.object({
          action: z.enum(['APPROVE', 'REJECT', 'REMOVE', 'DISMISS_REPORT', 'UNDO']),
          reason: z.string().trim().min(1).max(200).optional(),
        }),
      },
    },
    async (request, reply) => {
      const moderator = await request.requireRole('MODERATOR', 'ADMIN')
      const { action, reason } = request.body

      await prisma.$transaction(async (transaction) => {
        const comment = await transaction.comments.findUnique({
          where: { id: request.params.id },
          select: { status: true },
        })
        if (!comment) throw new ConflictError('Este comentário já foi tratado ou não existe.')

        if (action === 'APPROVE' || action === 'REJECT') {
          const result = await transaction.comments.updateMany({
            where: { id: request.params.id, status: 'PENDING' },
            data: {
              status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
              moderatedById: moderator.id,
              ...(action === 'REJECT' && reason && { moderationReason: reason }),
            },
          })
          if (result.count !== 1) throw new ConflictError('Este comentário já foi tratado ou não existe.')
        } else if (action === 'UNDO') {
          const result = await transaction.comments.updateMany({
            where: { id: request.params.id, status: { in: ['APPROVED', 'REJECTED'] }, moderatedById: { not: null } },
            data: { status: 'PENDING', moderatedById: null, moderationReason: null },
          })
          if (result.count !== 1) throw new ConflictError('Esta decisão não pode mais ser desfeita.')
        } else {
          if (comment.status !== 'APPROVED') {
            throw new ConflictError('Este comentário já foi tratado ou não existe.')
          }
          const reports = await transaction.commentReports.updateMany({
            where: { commentId: request.params.id, status: 'PENDING' },
            data: {
              status: action === 'REMOVE' ? 'ACTIONED' : 'DISMISSED',
              reviewedAt: new Date(),
              reviewedById: moderator.id,
            },
          })
          if (action === 'DISMISS_REPORT' && reports.count === 0) {
            throw new ConflictError('Este comentário não possui denúncia pendente.')
          }

          if (action === 'REMOVE') {
            const result = await transaction.comments.updateMany({
              where: { id: request.params.id, status: 'APPROVED' },
              data: { status: 'REMOVED', moderatedById: moderator.id, ...(reason && { moderationReason: reason }) },
            })
            if (result.count !== 1) throw new ConflictError('Este comentário já foi tratado ou não existe.')
          }
        }

        await transaction.auditLogs.create({
          data: {
            action: 'COMMENT_MODERATED',
            actorId: moderator.id,
            targetId: request.params.id,
            details: { action, reason },
          },
        })
      })

      return reply.status(204).send()
    },
  )
}
