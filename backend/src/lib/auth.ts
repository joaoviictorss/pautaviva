import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { APIError, createAuthMiddleware, isAPIError } from 'better-auth/api'

import { env } from '../env.js'
import { hashCpf, isValidCpf } from '../utils/cpf.js'
import { sendResetPasswordMail, sendVerificationMail } from './mail.js'
import { prisma } from './prisma.js'

const MAX_LOGIN_ATTEMPTS = 5
const LOCK_DURATION_MS = 15 * 60 * 1000

function accountLockedError(lockedUntil: Date) {
  return new APIError('FORBIDDEN', {
    code: 'ACCOUNT_LOCKED',
    message: 'Conta bloqueada temporariamente.',
    lockedUntil: lockedUntil.toISOString(),
  })
}

function resetLoginAttempts(userId: string) {
  return prisma.users.update({
    where: { id: userId },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  })
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [env.CORS_ORIGIN],
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      '/sign-up/email': { window: 10 * 60, max: 5 },
      '/sign-in/email': { window: 60, max: 10 },
      '/send-verification-email': { window: 60, max: 3 },
      '/request-password-reset': { window: 60, max: 3 },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordMail(user.email, user.name, url)
    },
    onPasswordReset: async ({ user }) => {
      await resetLoginAttempts(user.id)
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationMail(user.email, user.name, url)
    },
  },
  user: {
    modelName: 'users',
    // o link vai para o novo e-mail pelo sendVerificationEmail; o antigo vale até a confirmação
    changeEmail: { enabled: true },
    additionalFields: {
      cpf: {
        type: 'string',
        required: false,
        input: true,
        returned: false,
      },
      role: {
        type: 'string',
        required: true,
        defaultValue: 'CITIZEN',
        input: false,
      },
    },
  },
  session: {
    modelName: 'sessions',
  },
  account: {
    modelName: 'accounts',
  },
  verification: {
    modelName: 'verifications',
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === '/sign-in/email') {
        const email = String(ctx.body?.email ?? '').trim().toLowerCase()
        const user = await prisma.users.findUnique({
          where: { email },
          select: { lockedUntil: true },
        })

        if (user?.lockedUntil && user.lockedUntil > new Date()) {
          throw accountLockedError(user.lockedUntil)
        }

        return
      }

      if (ctx.path !== '/sign-up/email') return

      const rawCpf = ctx.body?.cpf as string | undefined
      if (!rawCpf || !isValidCpf(rawCpf)) {
        throw new APIError('BAD_REQUEST', { code: 'INVALID_CPF', message: 'CPF inválido.' })
      }

      const cpf = hashCpf(rawCpf, env.BETTER_AUTH_SECRET)
      const existingCpf = await prisma.users.findUnique({ where: { cpf } })
      if (existingCpf) {
        throw new APIError('BAD_REQUEST', {
          code: 'CPF_ALREADY_EXISTS',
          message: 'CPF já cadastrado.',
        })
      }

      return {
        context: {
          ...ctx,
          body: { ...ctx.body, cpf },
        },
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== '/sign-in/email') return

      const returned = ctx.context.returned

      if (!isAPIError(returned)) {
        const userId = ctx.context.newSession?.user.id
        if (userId) await resetLoginAttempts(userId)
        return
      }

      if (returned.body?.code !== 'INVALID_EMAIL_OR_PASSWORD') return

      const email = String(ctx.body?.email ?? '').trim().toLowerCase()
      const user = await prisma.users.findUnique({
        where: { email },
        select: { id: true, failedLoginAttempts: true, lockedUntil: true },
      })
      if (!user) return

      const previous = user.lockedUntil ? 0 : user.failedLoginAttempts
      const attempts = previous + 1

      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        const lockedUntil = new Date(Date.now() + LOCK_DURATION_MS)
        await prisma.users.update({
          where: { id: user.id },
          data: { failedLoginAttempts: 0, lockedUntil },
        })
        throw accountLockedError(lockedUntil)
      }

      await prisma.users.update({
        where: { id: user.id },
        data: { failedLoginAttempts: attempts, lockedUntil: null },
      })

      throw new APIError('UNAUTHORIZED', {
        code: 'INVALID_EMAIL_OR_PASSWORD',
        message: returned.body?.message ?? 'Invalid email or password',
        attemptsLeft: MAX_LOGIN_ATTEMPTS - attempts,
      })
    }),
  },
})

export type Auth = typeof auth
