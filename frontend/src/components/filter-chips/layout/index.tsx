import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

import type { FilterChipsLayoutProps } from '../data'

export function FilterChips<T extends string>({ label, chips, value, onChange }: FilterChipsLayoutProps<T>) {
  return (
    <ToggleGroup
      aria-label={label}
      variant="outline"
      className="flex-wrap"
      value={[value]}
      // sempre um filtro ativo: clicar no chip já selecionado não desmarca
      onValueChange={(values) => values[0] && onChange(values[0] as T)}
    >
      {chips.map((chip) => (
        <ToggleGroupItem
          key={chip.value}
          value={chip.value}
          className="h-9.5 gap-2 rounded-full bg-card px-4 font-semibold aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground"
        >
          {chip.label}
          {chip.count !== undefined && <span className="font-mono text-xs font-medium opacity-75">{chip.count}</span>}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
