import { Prisma } from '@prisma/client'
import type { FastifyInstance, FastifyRequest } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { env } from '../../env.js'
import { classifyComment } from '../../lib/comment-moderation.js'
import { sendNoticeMail } from '../../lib/mail.js'
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

/** Triagem automática: bloqueia o impróprio; se a triagem falhar, segue para moderação humana. */
async function screenComment(request: FastifyRequest, text: string, actorId: string, pollId: string) {
  let screening: Awaited<ReturnType<typeof classifyComment>> = null
  try {
    screening = await classifyComment(text)
  } catch (error) {
    request.log.error(error, 'falha na triagem automática de comentário; encaminhando para moderação humana')
  }

  if (screening?.classification === 'INAPPROPRIATE') {
    await prisma.auditLogs.create({
      data: {
        action: 'COMMENT_BLOCKED',
        actorId,
        targetId: pollId,
        details: { classification: screening.classification, reason: screening.reason },
      },
    })
    throw new BadRequestError('Seu comentário contém conteúdo impróprio e não pôde ser enviado.')
  }

  return screening
}

async function notifyCommentDecision(request: FastifyRequest, commentId: string, approved: boolean) {
  try {
    const comment = await prisma.comments.findUnique({
      where: { id: commentId },
      select: { poll: { select: { title: true } }, author: { select: { name: true, email: true, notifyComments: true } } },
    })
    if (!comment?.author.notifyComments) return
    await sendNoticeMail(comment.author.email, comment.author.name, {
      subject: approved ? 'Seu comentário foi publicado' : 'Seu comentário não foi aprovado',
      intro: `Seu comentário na pauta "${comment.poll.title}" ${approved ? 'foi aprovado e já está publicado' : 'não foi aprovado pela moderação'}.`,
      action: 'Ver meus comentários',
      url: `${env.CORS_ORIGIN}/minha-participacao?tab=comentarios`,
    })
  } catch (error) {
    request.log.error(error, 'falha ao notificar decisão de moderação')
  }
}

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

      const screening = await screenComment(request, request.body.text, user.id, poll.id)

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

  api.get('/comments/me', async (request) => {
    const user = await request.requireRole('CITIZEN')
    const comments = await prisma.comments.findMany({
      // exclusão pelo autor some da lista; remoção pela moderação continua visível, com o motivo
      where: { authorId: user.id, OR: [{ status: { not: 'REMOVED' } }, { moderatedById: { not: null } }] },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        text: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        moderatedById: true,
        moderationReason: true,
        poll: { select: { id: true, title: true, status: true, endsAt: true } },
      },
    })
    // o motivo da triagem automática é interno até haver decisão da moderação
    return comments.map(({ moderatedById, moderationReason, ...comment }) => ({
      ...comment,
      moderationReason: moderatedById ? moderationReason : null,
    }))
  })

  api.patch(
    '/comments/:id',
    { schema: { params: commentParams, body: commentBody } },
    async (request, reply) => {
      const user = await request.requireRole('CITIZEN')
      const comment = await prisma.comments.findUnique({ where: { id: request.params.id }, include: { poll: true } })
      if (!comment || comment.authorId !== user.id) throw new NotFoundError('Comentário não encontrado.')
      if (comment.status !== 'REJECTED') throw new BadRequestError('Só comentários não aprovados podem ser reenviados.')
      const now = new Date()
      if (comment.poll.status === 'CLOSED' || comment.poll.endsAt <= now) {
        throw new BadRequestError('Esta pauta não está disponível para comentários no momento.')
      }

      const screening = await screenComment(request, request.body.text, user.id, comment.pollId)
      await prisma.$transaction([
        prisma.comments.update({
          where: { id: comment.id },
          data: {
            text: request.body.text,
            status: 'PENDING',
            moderatedById: null,
            classification: screening?.classification ?? null,
            moderationReason: screening?.reason ?? null,
          },
        }),
        prisma.auditLogs.create({
          data: { action: 'COMMENT_RESUBMITTED', actorId: user.id, targetId: comment.id, details: { pollId: comment.pollId } },
        }),
      ])
      return reply.status(204).send()
    },
  )

  api.delete('/comments/:id', { schema: { params: commentParams } }, async (request, reply) => {
    const user = await request.requireRole('CITIZEN')
    const comment = await prisma.comments.findUnique({ where: { id: request.params.id } })
    if (!comment || comment.authorId !== user.id) throw new NotFoundError('Comentário não encontrado.')
    if (comment.status === 'REMOVED') throw new BadRequestError('Este comentário já foi removido.')

    // Mantém o registro como evidência; sem moderador, ele não entra no histórico nem pode ser desfeito.
    await prisma.$transaction([
      prisma.comments.update({ where: { id: comment.id }, data: { status: 'REMOVED', moderatedById: null } }),
      prisma.commentReports.updateMany({
        where: { commentId: comment.id, status: 'PENDING' },
        data: { status: 'DISMISSED', reviewedAt: new Date() },
      }),
      prisma.auditLogs.create({
        data: { action: 'COMMENT_DELETED_BY_AUTHOR', actorId: user.id, targetId: comment.id, details: { pollId: comment.pollId } },
      }),
    ])
    return reply.status(204).send()
  })

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

      if (action === 'APPROVE' || action === 'REJECT') void notifyCommentDecision(request, request.params.id, action === 'APPROVE')

      return reply.status(204).send()
    },
  )
}
