import type { CategoryLook } from '@/lib/poll/categories'
import type { Poll } from '@/lib/poll/types'

export interface MinhaParticipacaoProps {}

export interface ParticipationRecord {
  poll: Poll
  categoryLook: CategoryLook
  participatedAtLabel: string
  resultsAvailable: boolean
}

export interface MinhaParticipacaoLayoutProps extends MinhaParticipacaoProps {
  items: ParticipationRecord[]
  total: number
  resultsAvailable: number
  page: number
  pageSize: number
  loading: boolean
  error?: string
  onPageChange: (page: number) => void
  onBack: () => void
}

export interface ParticipationPage {
  total: number
  resultsAvailable: number
  page: number
  pageSize: number
  items: {
    participatedAt: string
    resultsAvailable: boolean
    poll: Poll
  }[]
}
