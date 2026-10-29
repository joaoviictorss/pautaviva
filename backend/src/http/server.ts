import fastifyCors from '@fastify/cors'
import fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'

import { env } from '../env.js'
import { errorHandler } from './error-handler.js'
import { authPlugin } from './middlewares/auth.js'
import { adminRoutes } from './routes/admin.js'
import { authRoutes } from './routes/auth.js'
import { commentRoutes } from './routes/comments.js'
import { pollRoutes } from './routes/polls.js'
import { userRoutes } from './routes/users.js'
import { setupSockets } from './sockets/index.js'
import { prisma } from '../lib/prisma.js'
import { startPollClosureScheduler } from '../lib/poll-scheduler.js'
import { protectStoredCpfs } from '../lib/protect-user-cpfs.js'

const app = fastify({ trustProxy: env.TRUST_PROXY }).withTypeProvider<ZodTypeProvider>()

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)
app.setErrorHandler(errorHandler)

app.register(fastifyCors, {
  origin: env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
  exposedHeaders: ['Content-Disposition'],
})

app.register(authPlugin)
app.register(authRoutes)
app.register(adminRoutes)
app.register(pollRoutes)
app.register(commentRoutes)
app.register(userRoutes)

await protectStoredCpfs()

app.get('/health', async (request, reply) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'ok' }
  } catch (error) {
    request.log.error({ err: error }, 'health check failed')
    return reply.status(503).send({ status: 'unavailable' })
  }
})

startPollClosureScheduler(app)

app.listen({ port: env.PORT, host: '0.0.0.0' }).then(() => {
  setupSockets(app.server)

  console.log(`HTTP server running on port ${env.PORT}`)
})
