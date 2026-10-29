import type { Poll } from '@/lib/poll/types'

export interface DiscussoesProps {}

export interface DiscussoesLayoutProps extends DiscussoesProps {
  polls: Poll[]
  loading: boolean
  error?: string
}
