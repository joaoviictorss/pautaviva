import { Reveal } from '@/components/reveal'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import type { ResultsLayoutProps } from '../data'

export function Results({
  poll: _poll,
  tabs,
  activeTab,
  favPctLabel,
  bars,
  donut,
  kpis,
  lineD,
  areaD,
  lastY,
  bairros,
  heat,
}: ResultsLayoutProps) {
  return (
    <section id="resultados" className="w-full scroll-mt-20 px-3.5 py-16 sm:px-10 md:py-24">
      <Reveal className="mx-auto flex max-w-[640px] flex-col items-center gap-3.5 text-center">
        <span className="text-sm font-semibold text-accent-foreground">Painel de resultados</span>
        <h2 className="text-[clamp(1.875rem,3.8vw,2.875rem)] leading-[1.1] font-bold text-balance tracking-[-0.035em]">
          Entenda quem participou, onde e quando
        </h2>
        <p className="max-w-[520px] text-lg leading-relaxed text-muted-foreground">
          Gráficos prontos durante e depois da votação — para o morador acompanhar e o gestor
          prestar contas.
        </p>
      </Reveal>

      <Reveal
        delay={100}
        className="mt-12 overflow-hidden rounded-[31px] bg-card shadow-[0_0_0_1px_rgba(0,0,0,.1),0_40px_80px_-48px_rgba(0,0,0,.3)]"
      >
        <Tabs
          value={activeTab}
          onValueChange={(value) => tabs.find((t) => t.id === value)?.onSelect()}
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-4.5">
            <div className="flex flex-col gap-0.5">
              <span className="text-base font-bold">Ciclofaixa na Av. Paulo VI</span>
              <span className="text-[13px] text-muted-foreground">Mobilidade · 03/11 a 17/11</span>
            </div>
            <TabsList>
              {tabs.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="vivo" className="m-0">
            <div className="flex flex-wrap gap-px bg-border">
              <div className="flex min-w-[280px] flex-1 flex-col gap-4.5 bg-card p-6">
                <span className="text-sm font-semibold">Distribuição dos votos</span>
                <div className="relative mx-auto size-[200px]">
                  <svg viewBox="0 0 140 140" className="size-full -rotate-90">
                    <circle cx="70" cy="70" r="54" fill="none" stroke="var(--muted)" strokeWidth="18" />
                    {donut.map((segment) => (
                      <circle
                        key={segment.key}
                        cx="70"
                        cy="70"
                        r="54"
                        fill="none"
                        stroke={segment.color}
                        strokeWidth="18"
                        strokeDasharray={segment.dashArray}
                        strokeDashoffset={segment.dashOffset}
                        className="transition-[stroke-dasharray,stroke-dashoffset] duration-700"
                      />
                    ))}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[30px] leading-none font-bold tracking-[-0.03em]">
                      {favPctLabel}
                    </span>
                    <span className="text-xs text-muted-foreground">a favor</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {bars.map((bar) => (
                    <div
                      key={bar.key}
                      className="flex items-center justify-between text-[13px]"
                    >
                      <span className="inline-flex items-center gap-2">
                        <span className="size-2.5 rounded-[3px]" style={{ background: bar.color }} />
                        {bar.label}
                      </span>
                      <span className="font-mono">{bar.countLabel}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex min-w-xs flex-2 flex-col gap-4.5 bg-card p-6">
                <div className="flex flex-wrap gap-3">
                  {kpis.map((kpi) => (
                    <div
                      key={kpi.label}
                      className="flex flex-1 basis-[140px] flex-col gap-1 rounded-[20px] bg-muted/60 px-4 py-3.5"
                    >
                      <span className="text-xs text-muted-foreground">{kpi.label}</span>
                      <span className="text-[22px] font-bold tracking-[-0.02em] tabular-nums">
                        {kpi.value}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Votos por minuto</span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="size-1.5 animate-[live-pulse_1.6s_ease-out_infinite] rounded-full bg-primary" />
                    últimos 30 min
                  </span>
                </div>
                <svg
                  viewBox="0 0 600 180"
                  preserveAspectRatio="none"
                  className="block h-[180px] w-full overflow-visible"
                >
                  <defs>
                    <linearGradient id="pv-area" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity=".28" />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <line x1="0" y1="45" x2="600" y2="45" stroke="var(--border)" strokeDasharray="3 5" />
                  <line x1="0" y1="100" x2="600" y2="100" stroke="var(--border)" strokeDasharray="3 5" />
                  <line x1="0" y1="170" x2="600" y2="170" stroke="var(--border)" />
                  <path d={areaD} fill="url(#pv-area)" />
                  <path
                    d={lineD}
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                  <circle
                    cx="600"
                    cy={lastY}
                    r="5"
                    fill="var(--card)"
                    stroke="var(--primary)"
                    strokeWidth="2.5"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bairro" className="m-0">
            <div className="flex flex-col gap-4 px-6 py-7">
              <div className="flex flex-wrap justify-between gap-3">
                <span className="text-sm font-semibold">Votos por bairro</span>
                <div className="flex gap-3.5">
                  {bars.map((bar) => (
                    <span
                      key={bar.key}
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
                    >
                      <span className="size-2 rounded-[3px]" style={{ background: bar.color }} />
                      {bar.label}
                    </span>
                  ))}
                </div>
              </div>
              {bairros.map((bairro) => (
                <div
                  key={bairro.name}
                  className="grid grid-cols-[minmax(0,130px)_minmax(0,1fr)_64px] items-center gap-4"
                >
                  <span className="text-[13px] font-medium">{bairro.name}</span>
                  <div className="flex h-6.5 gap-0.5 overflow-hidden rounded-[9px]">
                    <div
                      className="flex items-center pl-2 font-mono text-[11px] font-semibold text-primary-foreground"
                      style={{ background: 'var(--primary)', width: bairro.favWidth }}
                    >
                      {bairro.favWidth}
                    </div>
                    <div style={{ background: 'var(--chart-4)', width: bairro.contraWidth }} />
                    <div className="flex-1" style={{ background: 'var(--chart-5)' }} />
                  </div>
                  <span className="text-right font-mono text-xs text-muted-foreground">
                    {bairro.totalLabel}
                  </span>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="hora" className="m-0">
            <div className="flex flex-col gap-4 overflow-x-auto px-6 py-7">
              <div className="flex flex-wrap justify-between gap-3">
                <span className="text-sm font-semibold">Quando a comunidade participa</span>
                <span className="text-xs text-muted-foreground">Pico às 20h nos dias úteis</span>
              </div>
              <div className="flex min-w-[640px] flex-col gap-1">
                {heat.map((row) => (
                  <div
                    key={row.day}
                    className="grid grid-cols-[36px_repeat(24,minmax(0,1fr))] items-center gap-1"
                  >
                    <span className="text-xs text-muted-foreground">{row.day}</span>
                    {row.cells.map((cell, i) => (
                      <div
                        key={i}
                        title={cell.title}
                        className="aspect-square rounded-[6px]"
                        style={{ background: `oklch(0.6404 0.2153 35.9003 / ${cell.opacity})` }}
                      />
                    ))}
                  </div>
                ))}
                <div className="mt-1.5 grid grid-cols-[36px_repeat(4,minmax(0,1fr))] font-mono text-[11px] text-muted-foreground">
                  <span />
                  <span>00h</span>
                  <span>06h</span>
                  <span>12h</span>
                  <span>18h</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Reveal>
    </section>
  )
}
