import { useEffect, useState } from 'react'

import { socket } from '@/lib/socket'
import type { Poll } from '@/lib/poll/types'

export type PollLiveUpdate = Pick<Poll, 'results' | 'participations'>

/** `onSync` e `onResults` precisam ser estáveis (useCallback): mudar a referência reassina os eventos. */
export function usePollLive(pollId: string, onSync: () => void, onResults: (update: PollLiveUpdate) => void) {
  const [live, setLive] = useState(socket.connected)

  useEffect(() => {
    // a cada (re)conexão recarrega, para não perder o que aconteceu no intervalo
    const connect = () => {
      setLive(true)
      onSync()
    }
    const disconnect = () => setLive(false)
    const results = ({ pollId: id, ...update }: PollLiveUpdate & { pollId: string }) => {
      if (id === pollId) onResults(update)
    }
    const changed = ({ pollId: id }: { pollId: string }) => {
      if (id === pollId) onSync()
    }

    socket.on('connect', connect)
    socket.on('disconnect', disconnect)
    socket.on('poll-results', results)
    socket.on('polls-changed', changed)
    return () => {
      socket.off('connect', connect)
      socket.off('disconnect', disconnect)
      socket.off('poll-results', results)
      socket.off('polls-changed', changed)
    }
  }, [pollId, onSync, onResults])

  return live
}
