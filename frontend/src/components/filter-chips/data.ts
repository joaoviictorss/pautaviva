export interface FilterChip<T extends string = string> {
  value: T
  label: string
  count?: number
}

export interface FilterChipsProps<T extends string = string> {
  label: string
  chips: FilterChip<T>[]
  value: T
  onChange: (value: T) => void
}

export interface FilterChipsLayoutProps<T extends string = string> extends FilterChipsProps<T> {}
