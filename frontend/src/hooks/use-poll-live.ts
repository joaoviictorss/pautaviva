import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

import { env } from '@/env'
import type { Poll } from '@/lib/poll/types'

export type PollLiveUpdate = Pick<Poll, 'results' | 'participations'>

/** `onSync` e `onResults` precisam ser estáveis (useCallback): mudar a referência reconecta o socket. */
export function usePollLive(pollId: string, onSync: () => void, onResults: (update: PollLiveUpdate) => void) {
  const [live, setLive] = useState(false)

  useEffect(() => {
    const socket = io(env.VITE_API_URL, { withCredentials: true })
    // a cada (re)conexão entra na sala e recarrega, para não perder o que aconteceu no intervalo
    socket.on('connect', () => {
      socket.emit('join-poll', pollId)
      setLive(true)
      onSync()
    })
    socket.on('disconnect', () => setLive(false))
    socket.on('poll-results', onResults)
    socket.on('poll-closed', onSync)
    return () => {
      socket.disconnect()
    }
  }, [pollId, onSync, onResults])

  return live
}
