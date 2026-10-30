import type { VoteBar } from '@/lib/poll/votes'

export function PollResultBars({ bars }: { bars: VoteBar[] }) {
  return (
    <>
      <div
        role="img"
        aria-label={bars.map((bar) => `${bar.label}: ${bar.percentLabel}`).join(', ')}
        className="flex h-3.5 gap-0.75 overflow-hidden rounded-full bg-muted"
      >
        {bars.filter((bar) => bar.percent > 0).map((bar) => (
          <span key={bar.key} style={{ flex: bar.percent, background: bar.color }} />
        ))}
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
        {bars.map((bar) => (
          <div key={bar.key} className="flex flex-col gap-1.5 rounded-2xl bg-muted/60 p-3.5">
            <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-muted-foreground">
              <span className="size-2.5 rounded-[3px]" style={{ background: bar.color }} />
              {bar.label}
            </span>
            <span className="text-[30px] leading-none font-extrabold tracking-tighter">{bar.percentLabel}</span>
            <span className="text-[13px] text-muted-foreground">{bar.countLabel} {bar.countLabel === '1' ? 'voto' : 'votos'}</span>
          </div>
        ))}
      </div>
    </>
  )
}
