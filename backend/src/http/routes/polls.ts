import type { PollStatus, Polls } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { prisma } from '../../lib/prisma.js'
import { BadRequestError } from './_errors/bad-request-error.js'

const DAY_MS = 24 * 60 * 60 * 1000

// shortcut: situação calculada pelas datas até existir o job de abertura/encerramento (HU10).
function statusOf(poll: Pick<Polls, 'startsAt' | 'endsAt' | 'status'>, now = new Date()): PollStatus {
  if (poll.status === 'CLOSED' || poll.endsAt <= now) return 'CLOSED'
  return poll.startsAt > now ? 'SCHEDULED' : 'OPEN'
}

const pollBody = z.object({
  description: z.string().trim().min(10).max(2000),
  categoryId: z.string(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
})

function validatePeriod({ startsAt, endsAt }: { startsAt: Date; endsAt: Date }) {
  const now = Date.now()
  // o front manda o início do dia local; até 1 dia atrás ainda é "hoje" em qualquer fuso
  if (startsAt.getTime() < now - DAY_MS) throw new BadRequestError('A data de início não pode estar no passado.')
  if (endsAt <= startsAt || endsAt.getTime() <= now) {
    throw new BadRequestError('A data de término deve ser posterior à data de início.')
  }
}

export async function pollRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>()

  api.get('/categories', async (request) => {
    await request.getCurrentUser()
    return prisma.categories.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } })
  })

  // shortcut: sem paginação; paginar quando passar de algumas centenas de pautas.
  api.get('/polls', async (request) => {
    await request.getCurrentUser()

    const [polls, votes] = await Promise.all([
      prisma.polls.findMany({
        select: {
          id: true,
          title: true,
          description: true,
          startsAt: true,
          endsAt: true,
          status: true,
          category: { select: { id: true, name: true } },
          _count: { select: { participations: true } },
        },
        orderBy: { startsAt: 'desc' },
      }),
      prisma.votes.groupBy({ by: ['pollId', 'option'], _count: true, orderBy: { pollId: 'asc' } }),
    ])

    return polls.map(({ _count, ...poll }) => {
      const results = { FOR: 0, AGAINST: 0, ABSTAIN: 0 }
      for (const row of votes) if (row.pollId === poll.id) results[row.option] = row._count as number
      return { ...poll, status: statusOf(poll), participations: _count.participations, results }
    })
  })

  api.post(
    '/polls',
    { schema: { body: pollBody.extend({ title: z.string().trim().min(5).max(90) }) } },
    async (request, reply) => {
      const user = await request.requireRole('MANAGER', 'ADMIN')
      const data = request.body
      validatePeriod(data)

      const poll = await prisma.polls.create({
        data: { ...data, status: statusOf({ ...data, status: 'SCHEDULED' }), createdById: user.id },
      })
      await prisma.auditLogs.create({ data: { action: 'POLL_CREATED', actorId: user.id, targetId: poll.id } })

      return reply.status(201).send({ id: poll.id, status: poll.status })
    }
  )

  // Só pautas agendadas podem ser editadas, e o título não muda depois de publicado.
  api.patch(
    '/polls/:id',
    { schema: { params: z.object({ id: z.string() }), body: pollBody } },
    async (request, reply) => {
      const user = await request.requireRole('MANAGER', 'ADMIN')
      const poll = await prisma.polls.findUnique({ where: { id: request.params.id } })
      if (!poll) throw new BadRequestError('Pauta não encontrada.')
      if (statusOf(poll) !== 'SCHEDULED') throw new BadRequestError('Só pautas agendadas podem ser editadas.')

      const data = request.body
      validatePeriod(data)

      await prisma.$transaction([
        prisma.polls.update({
          where: { id: poll.id },
          data: { ...data, status: statusOf({ ...data, status: 'SCHEDULED' }) },
        }),
        prisma.auditLogs.create({ data: { action: 'POLL_UPDATED', actorId: user.id, targetId: poll.id } }),
      ])

      return reply.status(204).send()
    }
  )
}
