import type { LucideIcon } from 'lucide-react'
import type { CSSProperties } from 'react'

export interface FilterChip<T extends string = string> {
  value: T
  label: string
  icon?: LucideIcon
  /** Cores do chip selecionado, no lugar do laranja padrão. */
  activeStyle?: CSSProperties
  count?: number
}

export interface FilterChipsProps<T extends string = string> {
  label: string
  chips: FilterChip<T>[]
  value: T
  onChange: (value: T) => void
  /** Versão menor, para a segunda linha de filtros. */
  compact?: boolean
}

export interface FilterChipsLayoutProps<T extends string = string> extends FilterChipsProps<T> {}
