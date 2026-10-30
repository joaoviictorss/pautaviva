import { differenceInCalendarDays, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { getCategoryLook, type CategoryLook } from '@/lib/poll/categories'
import type { Poll } from '@/lib/poll/types'
import { VOTE_OPTIONS } from '@/lib/poll/votes'
import { formatNumber } from '@/lib/utils/format'

const URGENT_DAYS = 6

const shortDate = (iso: string) => format(new Date(iso), 'dd MMM', { locale: ptBR }).replace('.', '')

export interface ClosingPollRow {
  id: string
  title: string
  timeLabel: string
  urgent: boolean
  bar: { segments: { key: string; color: string; percent: number }[]; label: string }
  participationsLabel: string
}

export interface UpcomingPollRow {
  id: string
  title: string
  day: string
  month: string
  detail: string
}

export interface ParticipationRow {
  id: string
  title: string
  categoryLook: CategoryLook
  detail: string
  actionLabel: string
}

export function toClosingRow(poll: Poll): ClosingPollRow {
  const { FOR, AGAINST, ABSTAIN } = poll.results
  const totalVotes = FOR + AGAINST + ABSTAIN
  const percents = [FOR, AGAINST, ABSTAIN].map((votes) => (totalVotes ? Math.round((votes / totalVotes) * 100) : 0))
  const days = differenceInCalendarDays(new Date(poll.endsAt), new Date())

  return {
    id: poll.id,
    title: poll.title,
    timeLabel: days <= 0 ? 'Encerra hoje' : days === 1 ? '1 dia' : `${days} dias`,
    urgent: days <= URGENT_DAYS,
    bar: {
      segments: VOTE_OPTIONS.map(({ key, color }, i) => ({ key, color, percent: percents[i] })),
      label: `${percents[0]}% a favor, ${percents[1]}% contra, ${percents[2]}% abstenção`,
    },
    participationsLabel: `${formatNumber(poll.participations)} ${poll.participations === 1 ? 'participação' : 'participações'}`,
  }
}

export function toUpcomingRow(poll: Pick<Poll, 'id' | 'title' | 'startsAt' | 'endsAt'> & { category: { name: string } }): UpcomingPollRow {
  return {
    id: poll.id,
    title: poll.title,
    day: format(new Date(poll.startsAt), 'dd'),
    month: format(new Date(poll.startsAt), 'MMM', { locale: ptBR }).replace('.', ''),
    detail: `${poll.category.name} · até ${shortDate(poll.endsAt)}`,
  }
}

export function toParticipationRow(item: { participatedAt: string; resultsAvailable: boolean; poll: Poll }): ParticipationRow {
  const date = format(new Date(item.participatedAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })

  return {
    id: item.poll.id,
    title: item.poll.title,
    categoryLook: getCategoryLook(item.poll.category.name),
    detail: `${item.poll.category.name} · Participou em ${date}${item.resultsAvailable ? '' : ' · Votação ainda não iniciada'}`,
    actionLabel: item.resultsAvailable ? 'Ver resultados' : 'Ver pauta',
  }
}
