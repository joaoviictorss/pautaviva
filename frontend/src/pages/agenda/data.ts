export interface AgendaProps {}

export interface AgendaEvent {
  key: string
  pollId: string
  title: string
  category: string
  kindLabel: string
  time: string
  tone: 'open' | 'close' | 'past'
  badge?: { label: string; className: string }
}

export interface AgendaDay {
  key: string
  date: Date
  label: string
  ariaLabel: string
  inMonth: boolean
  today: boolean
  selected: boolean
  events: AgendaEvent[]
}

export interface AgendaGroup {
  label: string
  events: AgendaEvent[]
}

export interface AgendaLayoutProps extends AgendaProps {
  monthLabel: string
  weekdays: string[]
  days: AgendaDay[]
  listTitle: string
  groups: AgendaGroup[]
  hasSelectedDay: boolean
  loading: boolean
  error?: string
  onPreviousMonth: () => void
  onNextMonth: () => void
  onToday: () => void
  onDaySelect: (day: AgendaDay) => void
  onClearDay: () => void
}
