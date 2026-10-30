import { Field, FieldLabel, FieldTitle } from '@/components/ui/field'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { VoteOption } from '@/lib/poll/types'
import { VOTE_OPTIONS } from '@/lib/poll/votes'

interface VoteOptionsProps {
  id: string
  value?: VoteOption
  onChange: (option: VoteOption) => void
}

export function VoteOptions({ id, value, onChange }: VoteOptionsProps) {
  return (
    <RadioGroup aria-label="Opção de voto" value={value ?? null} onValueChange={(option) => onChange(option as VoteOption)}>
      {VOTE_OPTIONS.map((item) => (
        <FieldLabel key={item.value} htmlFor={`${id}-${item.value}`} className="rounded-xl!">
          <Field orientation="horizontal" className="items-center">
            <item.icon className="size-4.5 shrink-0" style={{ color: item.color }} />
            <FieldTitle className="flex-1">{item.label}</FieldTitle>
            <RadioGroupItem id={`${id}-${item.value}`} value={item.value} />
          </Field>
        </FieldLabel>
      ))}
    </RadioGroup>
  )
}
