import { Prisma, type PollStatus, type Polls } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { prisma } from '../../lib/prisma.js'
import { BadRequestError } from './_errors/bad-request-error.js'
import { emitToPoll } from '../sockets/index.js'
import { ConflictError } from './_errors/conflict-error.js'

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

const pollSelect = {
  id: true,
  title: true,
  description: true,
  startsAt: true,
  endsAt: true,
  status: true,
  category: { select: { id: true, name: true } },
  _count: { select: { participations: true } },
} satisfies Prisma.PollsSelect


function toPollView({ _count, ...poll }: Prisma.PollsGetPayload<{ select: typeof pollSelect }>, votes: VoteCount[]) {
  const results = { FOR: 0, AGAINST: 0, ABSTAIN: 0 }
  for (const row of votes) if (row.pollId === poll.id) results[row.option] = row.count
  return { ...poll, status: statusOf(poll), participations: _count.participations, results }
}

async function countVotes(where: Prisma.VotesWhereInput = {}) {
  const rows = await prisma.votes.groupBy({ by: ['pollId', 'option'], where, _count: { _all: true } })
  return rows.map((row) => ({ pollId: row.pollId, option: row.option, count: row._count._all }))
}

type VoteCount = Awaited<ReturnType<typeof countVotes>>[number]

async function broadcastResults(pollId: string) {
  const [votes, participations] = await Promise.all([
    countVotes({ pollId }),
    prisma.participations.count({ where: { pollId } }),
  ])
  const results = { FOR: 0, AGAINST: 0, ABSTAIN: 0 }
  for (const row of votes) results[row.option] = row.count
  emitToPoll(pollId, 'poll-results', { results, participations })
}

export async function pollRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>()

  // Consulta pública (UC04): categorias, lista e detalhe não exigem login.
  api.get('/categories', async () => {
    return prisma.categories.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } })
  })

  // shortcut: sem paginação; paginar quando passar de algumas centenas de pautas.
  api.get('/polls', async () => {
    const [polls, votes] = await Promise.all([
      prisma.polls.findMany({ select: pollSelect, orderBy: { startsAt: 'desc' } }),
      countVotes(),
    ])
    return polls.map((poll) => toPollView(poll, votes))
  })

  api.get('/polls/:id', { schema: { params: z.object({ id: z.string() }) } }, async (request) => {
    const { id } = request.params
    const [poll, votes, user] = await Promise.all([
      prisma.polls.findUnique({ where: { id }, select: pollSelect }),
      countVotes({ pollId: id }),
      request.getCurrentUser().catch(() => null),
    ])
    if (!poll) throw new BadRequestError('Pauta não encontrada.')

    const hasVoted = user
      ? !!(await prisma.participations.findUnique({ where: { pollId_userId: { pollId: id, userId: user.id } } }))
      : false

    return { ...toPollView(poll, votes), hasVoted }
  })

  // Participação e voto em tabelas separadas, na mesma transação: o voto não guarda quem votou (RNF05).
  api.post(
    '/polls/:id/votes',
    { schema: { params: z.object({ id: z.string() }), body: z.object({ option: z.enum(['FOR', 'AGAINST', 'ABSTAIN']) }) } },
    async (request, reply) => {
      const user = await request.requireRole('CITIZEN')
      const poll = await prisma.polls.findUnique({ where: { id: request.params.id } })
      if (!poll) throw new BadRequestError('Pauta não encontrada.')
      if (statusOf(poll) !== 'OPEN') {
        throw new BadRequestError('Esta pauta não está disponível para votação no momento.')
      }

      try {
        await prisma.$transaction([
          prisma.participations.create({ data: { pollId: poll.id, userId: user.id } }),
          prisma.votes.create({ data: { pollId: poll.id, option: request.body.option } }),
        ])
      } catch (err) {
        // o unique (pollId, userId) barra o voto duplicado, inclusive em requisições simultâneas
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          throw new ConflictError('Você já votou nesta pauta.')
        }
        throw err
      }

      // falha na propagação não afeta a confirmação do voto; o cliente ressincroniza ao reconectar (UC05, E03)
      broadcastResults(poll.id).catch((err) => request.log.error(err, 'falha ao propagar resultados'))

      return reply.status(201).send()
    }
  )

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
