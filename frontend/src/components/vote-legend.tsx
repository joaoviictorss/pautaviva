import { VOTE_OPTIONS } from '@/lib/poll/votes'

export function VoteLegend() {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
      {VOTE_OPTIONS.map((option) => (
        <span key={option.key} className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px]" style={{ background: option.color }} />
          {option.label}
        </span>
      ))}
      <span>Resultados agregados — votos individuais não são exibidos.</span>
    </div>
  )
}
