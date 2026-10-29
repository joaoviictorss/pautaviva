import type { Poll } from '@/lib/poll/types'

export interface AgendaProps {}

export interface AgendaLayoutProps extends AgendaProps {
  month: Date
  selectedDay: Date
  polls: Poll[]
  loading: boolean
  error?: string
  onMonthChange: (month: Date) => void
  onDaySelect: (day: Date) => void
}
