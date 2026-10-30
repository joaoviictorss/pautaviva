import { io } from 'socket.io-client'

import { env } from '@/env'

export type LiveEvent = 'poll-results' | 'polls-changed' | 'comments-changed'

// uma conexão para o app todo; os eventos só levam ids e contagens públicas, então não precisa de sessão
export const socket = io(env.VITE_API_URL)
