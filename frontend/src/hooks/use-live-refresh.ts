import { useEffect, useRef } from 'react'

import { socket, type LiveEvent } from '@/lib/socket'

const THROTTLE_MS = 1000

/**
 * Chama `onChange` quando o backend avisa que algo mudou, e ao reconectar, para não perder o que houve no intervalo.
 * Vários avisos seguidos viram um só recarregamento. Com `pollId`, ignora os avisos de outras pautas.
 */
export function useLiveRefresh(events: LiveEvent[], onChange: () => void, pollId?: string) {
  const callback = useRef(onChange)
  const key = events.join()

  useEffect(() => {
    callback.current = onChange
  })

  useEffect(() => {
    const names = key.split(',')
    let timer: ReturnType<typeof setTimeout> | undefined
    const schedule = (payload?: { pollId?: string }) => {
      if (pollId && payload?.pollId && payload.pollId !== pollId) return
      timer ??= setTimeout(() => {
        timer = undefined
        callback.current()
      }, THROTTLE_MS)
    }

    const onReconnect = () => schedule()

    for (const name of names) socket.on(name, schedule)
    socket.io.on('reconnect', onReconnect)
    return () => {
      clearTimeout(timer)
      for (const name of names) socket.off(name, schedule)
      socket.io.off('reconnect', onReconnect)
    }
  }, [key, pollId])
}
