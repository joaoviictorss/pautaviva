import type { Poll } from '@/lib/poll/types'

export interface PautaProps {}

export interface PautaLayoutProps extends PautaProps {
  poll?: Poll
  loading: boolean
  error?: string
}
