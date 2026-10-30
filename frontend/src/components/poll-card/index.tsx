import { differenceInCalendarDays, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { getCategoryLook } from '@/lib/poll/categories'
import { POLL_STATUS } from '@/lib/poll/status'
import { VOTE_OPTIONS } from '@/lib/poll/votes'
import { formatNumber } from '@/lib/utils/format'

import { PollCard as Layout } from './layout'
import type { PollCardLayoutProps, PollCardProps } from './data'

const dateLabel = (iso: string) => format(new Date(iso), 'dd MMM yyyy', { locale: ptBR }).replace('.', '')

export function PollCard(props: PollCardProps) {
  const { poll, onEdit } = props
  const { FOR, AGAINST, ABSTAIN } = poll.results
  const totalVotes = FOR + AGAINST + ABSTAIN
  const votes = [FOR, AGAINST, ABSTAIN]
  const percents = votes.map((count) => (totalVotes ? (count / totalVotes) * 100 : 0))
  const daysLeft = differenceInCalendarDays(new Date(poll.endsAt), new Date())

  const layoutProps: PollCardLayoutProps = {
    ...props,
    categoryLook: getCategoryLook(poll.category.name),
    statusLabel: POLL_STATUS[poll.status].label,
    statusClassName: POLL_STATUS[poll.status].className,
    bar: poll.status !== 'SCHEDULED' || totalVotes > 0
      ? {
          segments: VOTE_OPTIONS.map(({ key, color }, i) => ({ key, color, percent: percents[i] })),
          label: `${totalVotes} votos registrados`,
        }
      : undefined,
    participationsLabel: `${formatNumber(poll.participations)} ${poll.participations === 1 ? 'participação' : 'participações'}`,
    scheduleLabel: `${poll.status === 'SCHEDULED' ? 'Votação' : 'Período'}: ${dateLabel(poll.startsAt)} – ${dateLabel(poll.endsAt)}`,
    timeLabel:
      poll.status === 'OPEN'
        ? daysLeft <= 0
          ? 'Encerra hoje'
          : daysLeft === 1
            ? 'Encerra amanhã'
            : `Encerra em ${daysLeft} dias`
        : undefined,
    onEditClick: onEdit && poll.status === 'SCHEDULED' ? () => onEdit(poll) : undefined,
  }

  return <Layout {...layoutProps} />
}
