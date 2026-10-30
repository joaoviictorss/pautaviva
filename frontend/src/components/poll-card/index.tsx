import { differenceInCalendarDays, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { getCategoryLook } from '@/lib/poll/categories'
import { getPollTimeLabel, POLL_STATUS } from '@/lib/poll/status'
import { VOTE_OPTIONS } from '@/lib/poll/votes'
import { getDefaultAvatars } from '@/lib/utils/avatar'
import { formatNumber } from '@/lib/utils/format'

import { PollCard as Layout } from './layout'
import type { PollCardLayoutProps, PollCardProps } from './data'

const MAX_AVATARS = 3

const shortDate = (iso: string) => format(new Date(iso), 'dd MMM', { locale: ptBR }).replace('.', '')

export function PollCard(props: PollCardProps) {
  const { poll, onEdit, citizen } = props
  const { FOR, AGAINST, ABSTAIN } = poll.results
  const totalVotes = FOR + AGAINST + ABSTAIN
  const percents = [FOR, AGAINST, ABSTAIN].map((votes) => (totalVotes ? Math.round((votes / totalVotes) * 100) : 0))
  const daysLeft = differenceInCalendarDays(new Date(poll.endsAt), new Date())
  const daysUntil = differenceInCalendarDays(new Date(poll.startsAt), new Date())

  const layoutProps: PollCardLayoutProps = {
    ...props,
    categoryLook: getCategoryLook(poll.category.name),
    statusLabel: POLL_STATUS[poll.status].label,
    statusClassName: POLL_STATUS[poll.status].className,
    bar: totalVotes
      ? {
          segments: VOTE_OPTIONS.map(({ key, color }, i) => ({ key, color, percent: percents[i] })),
          label: `${percents[0]}% a favor, ${percents[1]}% contra, ${percents[2]}% abstenção`,
          forLabel: `${percents[0]}% a favor`,
        }
      : undefined,
    participantAvatars: getDefaultAvatars(poll.id, Math.min(MAX_AVATARS, poll.participations)),
    citizenTimeLabel: citizen ? getPollTimeLabel(poll) : undefined,
    participationsLabel:
      poll.status === 'SCHEDULED' && !citizen
        ? undefined
        : `${formatNumber(poll.participations)} ${poll.participations === 1 ? 'participação' : 'participações'}`,
    scheduleLabel:
      poll.status === 'SCHEDULED' && !citizen
        ? `${daysUntil <= 1 ? 'Abre amanhã' : `Abre em ${shortDate(poll.startsAt)}`} · até ${shortDate(poll.endsAt)}`
        : undefined,
    timeLabel:
      poll.status === 'OPEN' && !citizen
        ? daysLeft <= 0
          ? 'Encerra hoje'
          : daysLeft === 1
            ? '1 dia restante'
            : `${daysLeft} dias restantes`
        : undefined,
    onEditClick: onEdit && poll.status === 'SCHEDULED' ? () => onEdit(poll) : undefined,
  }

  return <Layout {...layoutProps} />
}
