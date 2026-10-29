import type { Server as HttpServer } from 'node:http'

import { fromNodeHeaders } from 'better-auth/node'
import { Server } from 'socket.io'

import { env } from '../../env.js'
import { auth } from '../../lib/auth.js'

// shortcut: salas em memória, só funciona com uma instância do backend; usar @socket.io/redis-adapter ao escalar.
let io: Server | undefined

export function setupSockets(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true,
    },
  })

  // Acompanhar resultados é público (UC09): a sessão é opcional.
  io.use(async (socket, next) => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(socket.request.headers),
    })

    socket.data.userId = session?.user.id
    next()
  })

  io.on('connection', (socket) => {
    socket.on('join-poll', (pollId: string) => {
      socket.join(`poll:${pollId}`)
    })

    socket.on('leave-poll', (pollId: string) => {
      socket.leave(`poll:${pollId}`)
    })
  })

  return io
}

export function emitToPoll(pollId: string, event: string, payload: unknown) {
  io?.to(`poll:${pollId}`).emit(event, payload)
}
