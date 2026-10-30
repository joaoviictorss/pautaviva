import { api } from '@/lib/api/client'

import type { ParticipationItem } from './types'

const PAGE_SIZE = 50

export async function fetchAllParticipations() {
  const items: ParticipationItem[] = []
  for (let page = 1; ; page++) {
    const result = await api<{ total: number; items: ParticipationItem[] }>(`/participations/me?page=${page}&pageSize=${PAGE_SIZE}`)
    items.push(...result.items)
    if (page * PAGE_SIZE >= result.total) return items
  }
}
