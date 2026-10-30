import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

import { cn } from '@/lib/utils'

import type { FilterChipsLayoutProps } from '../data'

export function FilterChips<T extends string>({ label, chips, value, onChange, compact }: FilterChipsLayoutProps<T>) {
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
          style={chip.value === value ? chip.activeStyle : undefined}
          className={cn(
            'rounded-full bg-card font-semibold aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground',
            compact ? 'h-8.5 gap-1.5 pr-3 pl-2.5 text-[13px]' : 'h-9.5 gap-2 px-4',
          )}
        >
          {chip.icon && <chip.icon />}
          {chip.label}
          {chip.count !== undefined && <span className="font-mono text-xs font-medium opacity-75">{chip.count}</span>}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
