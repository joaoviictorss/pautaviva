import type { Server as HttpServer } from 'node:http'

import { Server } from 'socket.io'

import { env } from '../../env.js'

// shortcut: emissão em memória, só funciona com uma instância do backend; usar @socket.io/redis-adapter ao escalar.
let io: Server | undefined

export type LiveEvent = 'poll-results' | 'polls-changed' | 'comments-changed'

export function setupSockets(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true,
    },
  })

  return io
}

/** Vai para todos: os payloads só levam ids e contagens públicas (UC09), e cada tela decide se recarrega. */
export function emitLive(event: LiveEvent, payload: { pollId: string } & Record<string, unknown>) {
  io?.emit(event, payload)
}
