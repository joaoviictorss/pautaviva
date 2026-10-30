import type { VoteBar } from '@/lib/poll/votes'

export function PollResultBars({ bars }: { bars: VoteBar[] }) {
  return (
    <>
      {bars.map((bar) => (
        <div key={bar.key} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="font-semibold">{bar.label}</span>
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">{bar.percentLabel}</span> · {bar.countLabel}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{ width: `${bar.percent}%`, background: bar.color }}
            />
          </div>
        </div>
      ))}
    </>
  )
}
