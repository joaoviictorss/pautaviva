import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { env } from '../../env.js'
import { auth } from '../../lib/auth.js'
import { prisma } from '../../lib/prisma.js'
import { BadRequestError } from './_errors/bad-request-error.js'
import { ConflictError } from './_errors/conflict-error.js'

const PAGE_SIZE = 20
const roleSchema = z.enum(['CITIZEN', 'MANAGER', 'MODERATOR', 'ADMIN'])

// Sem fastify-plugin de propósito: o hook de admin vale só para as rotas deste arquivo.
export async function adminRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>()

  api.addHook('preHandler', async (request) => {
    await request.requireRole('ADMIN')
  })

  api.get(
    '/admin/users',
    {
      schema: {
        querystring: z.object({
          search: z.string().trim().optional(),
          role: roleSchema.optional(),
          page: z.coerce.number().int().min(1).default(1),
        }),
      },
    },
    async (request) => {
      const { search, role, page } = request.query
      const searchWhere = search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}
      const where = { ...searchWhere, ...(role && { role }) }

      const [users, total, byRole] = await prisma.$transaction([
        prisma.users.findMany({
          where,
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            createdAt: true,
            accounts: { where: { providerId: 'credential' }, select: { id: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
        }),
        prisma.users.count({ where }),
        prisma.users.groupBy({ by: ['role'], where: searchWhere, _count: true, orderBy: { role: 'asc' } }),
      ])

      return {
        // sem conta de senha = ainda não usou o link enviado no cadastro
        users: users.map(({ accounts, ...user }) => ({ ...user, pending: accounts.length === 0 })),
        total,
        pageSize: PAGE_SIZE,
        countsByRole: Object.fromEntries(byRole.map((row) => [row.role, row._count])),
      }
    }
  )

  api.post(
    '/admin/users',
    {
      schema: {
        body: z.object({
          name: z.string().trim().min(3),
          email: z.string().trim().toLowerCase().pipe(z.email()),
          role: z.enum(['MANAGER', 'MODERATOR']),
        }),
      },
    },
    async (request, reply) => {
      const actorId = await request.getCurrentUserId()
      const { name, email, role } = request.body

      if (await prisma.users.findUnique({ where: { email } })) {
        throw new ConflictError('Já existe uma conta com este e-mail.')
      }

      // E-mail já verificado: sem senha não há login, e a senha só chega por esse e-mail.
      const user = await prisma.users.create({
        data: { id: crypto.randomUUID(), name, email, role, emailVerified: true },
      })
      await prisma.auditLogs.create({
        data: { action: 'USER_CREATED', actorId, targetId: user.id, details: { role } },
      })

      await auth.api.requestPasswordReset({
        body: { email, redirectTo: `${env.CORS_ORIGIN}/redefinir-senha` },
      })

      return reply.status(201).send({ id: user.id })
    }
  )

  api.patch(
    '/admin/users/:id/role',
    {
      schema: {
        params: z.object({ id: z.string() }),
        body: z.object({ role: roleSchema }),
      },
    },
    async (request, reply) => {
      const actorId = await request.getCurrentUserId()
      const { id } = request.params
      const { role } = request.body

      if (id === actorId && role !== 'ADMIN') {
        throw new BadRequestError('Você não pode remover o seu próprio perfil de administrador.')
      }

      const target = await prisma.users.findUnique({ where: { id }, select: { role: true } })
      if (!target) throw new BadRequestError('Usuário não encontrado.')
      if (target.role === role) return reply.status(204).send()

      await prisma.$transaction([
        prisma.users.update({ where: { id }, data: { role } }),
        prisma.auditLogs.create({
          data: { action: 'ROLE_CHANGED', actorId, targetId: id, details: { from: target.role, to: role } },
        }),
      ])

      return reply.status(204).send()
    }
  )
}
