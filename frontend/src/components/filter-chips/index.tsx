import { FilterChips as Layout } from './layout'
import type { FilterChipsLayoutProps, FilterChipsProps } from './data'

export function FilterChips<T extends string>(props: FilterChipsProps<T>) {
  const layoutProps: FilterChipsLayoutProps<T> = { ...props }

  return <Layout {...layoutProps} />
}
