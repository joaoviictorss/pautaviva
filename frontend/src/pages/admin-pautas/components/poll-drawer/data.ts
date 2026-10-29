import type { FormField } from '@/lib/form/field'
import type { CategoryLook } from '@/lib/poll/categories'
import type { Category, Poll } from '@/lib/poll/types'

export interface PollDrawerProps {
  open: boolean
  poll?: Poll
  categories: Category[]
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

export interface PollDrawerCategoryOption {
  id: string
  name: string
  look: CategoryLook
  selected: boolean
}

export interface PollDrawerLayoutProps extends PollDrawerProps {
  editing: boolean
  title: FormField
  description: FormField
  start: FormField
  end: FormField
  categoryId: string
  onCategoryChange: (categoryId: string) => void
  categoryOptions: PollDrawerCategoryOption[]
  categoryError?: string
  preview: { label: string; className: string; text: string }
  loading: boolean
  onSubmit: (event?: React.BaseSyntheticEvent) => Promise<void>
}
