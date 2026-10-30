import { ChevronDown, ChevronRight, Download, FileSpreadsheet, FileText } from 'lucide-react'
import type { ReactNode } from 'react'

import { Reveal } from '@/components/reveal'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { FeaturesLayoutProps, StackPanelStyle } from '../data'

const PANEL_CLASS =
  'col-start-1 row-start-1 flex flex-col justify-center gap-3 rounded-[24px] bg-white p-5 text-foreground transition-[opacity,transform] duration-600 ease-[cubic-bezier(.16,1,.3,1)]'

function panelStyle(style: StackPanelStyle) {
  return {
    opacity: style.opacity,
    transform: style.transform,
    zIndex: style.zIndex,
    pointerEvents: style.pointerEvents,
  }
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

export function Features({
  poll: _poll,
  flowSteps,
  panelStyles,
  favPctLabel,
  totalLabel,
  bars,
  moderationFeed,
  publishedLabel: _publishedLabel,
  syncClients,
}: FeaturesLayoutProps) {
  return (
    <section id="recursos" className="scroll-mt-20 px-3.5 sm:px-10">
      <div className="relative w-full overflow-hidden rounded-[40px] bg-[oklch(0.1448_0_0)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_45%_at_12%_0%,oklch(0.6404_0.2153_35.9/.38),transparent_70%),radial-gradient(50%_40%_at_100%_100%,oklch(0.5828_0.1809_259.7/.18),transparent_70%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(rgba(255,255,255,.07)_1px,transparent_1px)] [background-size:22px_22px]" />

        <div className="relative flex w-full flex-col gap-6 px-4 py-16 sm:px-8 md:py-24">
          <Reveal className="mx-auto mb-2 flex max-w-[680px] flex-col gap-3.5 text-center">
            <span className="text-sm font-semibold text-[oklch(0.85_0.09_40)]">
              Da proposta ao resultado
            </span>
            <h2 className="text-[clamp(1.9rem,4vw,3rem)] leading-[1.1] font-bold text-balance text-white">
              Uma pauta, do começo ao fim,{' '}
              <span className="font-serif font-medium italic">num lugar só</span>
            </h2>
          </Reveal>

          {/* A: ciclo da pauta */}
          <Reveal className="grid items-center gap-10 rounded-[31px] border border-white/12 bg-white/4 p-6 sm:p-10 lg:grid-cols-2">
            <div>
              <h3 className="text-[clamp(1.5rem,2.4vw,1.875rem)] font-bold tracking-[-0.025em] text-white">
                O gestor cria. A comunidade decide.
              </h3>
              <p className="mt-3 max-w-[440px] text-base leading-relaxed text-pretty text-white/90">
                A pauta nasce com título, categoria e período de votação. Abre sozinha na data
                marcada, fecha sozinha no prazo e o resultado já sai pronto para exportar.
              </p>

              <div className="mt-7 flex flex-col gap-1">
                {flowSteps.map((step) => (
                  <Button
                    key={step.n}
                    type="button"
                    variant="ghost"
                    onClick={step.onSelect}
                    className={cn(
                      'grid h-auto grid-cols-[28px_1fr] items-center justify-normal gap-3 px-0 py-2 text-left whitespace-normal hover:bg-transparent',
                      step.active ? 'text-white' : 'text-white/62'
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-7 items-center justify-center rounded-full border font-mono text-xs transition-colors',
                        step.active ? 'border-primary bg-primary' : 'border-white/25'
                      )}
                    >
                      {step.n}
                    </span>
                    <span className="flex flex-col gap-1.5">
                      <span className={cn('text-[15px]', step.active ? 'font-bold' : 'font-medium')}>
                        {step.label}
                      </span>
                      <span className="block h-0.5 overflow-hidden rounded-full bg-white/14">
                        {step.animating ? (
                          <span
                            key={step.animateKey}
                            className="block h-full animate-[flow-fill_3600ms_linear_forwards] rounded-full bg-primary"
                          />
                        ) : (
                          <span
                            className="block h-full rounded-full bg-primary transition-[width]"
                            style={{ width: `${step.progressPercent}%` }}
                          />
                        )}
                      </span>
                    </span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="relative mx-auto box-border w-full max-w-[440px] rounded-[31px] border border-white/16 bg-white/10 p-2">
              <div className="grid pt-8">
                <div className={PANEL_CLASS} style={panelStyle(panelStyles[0])}>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold">Nova pauta</span>
                    <Badge variant="secondary" className="h-auto rounded-full px-2.5 py-0.5 text-xs">
                      Agendada
                    </Badge>
                  </div>
                  <Field label="Título">
                    <div className="flex h-9 items-center rounded-[12px] border border-input px-3 text-[13px]">
                      Ciclofaixa na Av. Paulo VI
                    </div>
                  </Field>
                  <Field label="Categoria">
                    <div className="flex h-9 items-center justify-between rounded-[12px] border border-input px-3 text-[13px]">
                      Mobilidade
                      <ChevronDown className="size-3.5 text-muted-foreground" />
                    </div>
                  </Field>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Início">
                      <div className="flex h-9 items-center rounded-[12px] border border-input px-3 font-mono text-xs">
                        03/11 · 08:00
                      </div>
                    </Field>
                    <Field label="Término">
                      <div className="flex h-9 items-center rounded-[12px] border border-input px-3 font-mono text-xs">
                        17/11 · 20:00
                      </div>
                    </Field>
                  </div>
                  <div className="mt-1 flex h-9.5 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    Publicar pauta
                  </div>
                </div>

                <div className={PANEL_CLASS} style={panelStyle(panelStyles[1])}>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold">Qual sua posição?</span>
                    <Badge className="h-auto rounded-full bg-accent px-2.5 py-0.5 text-xs text-accent-foreground">
                      Aberta
                    </Badge>
                  </div>
                  {bars.map((bar, index) => (
                    <div
                      key={bar.key}
                      className={cn(
                        'flex items-center gap-3 rounded-[16px] border px-3.5 py-3',
                        index === 0 ? 'border-primary bg-accent' : 'border-border bg-transparent'
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-4.5 items-center justify-center rounded-full border-[1.5px]',
                          index === 0 ? 'border-primary' : 'border-border'
                        )}
                      >
                        {index === 0 && <span className="size-2 rounded-full bg-primary" />}
                      </span>
                      <span className="text-sm font-medium">{bar.label}</span>
                    </div>
                  ))}
                  <div className="mt-1 flex h-9.5 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    Confirmar voto
                  </div>
                </div>

                <div className={PANEL_CLASS} style={panelStyle(panelStyles[2])}>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold">Resultado parcial</span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-foreground">
                      <span className="size-1.5 animate-[live-pulse_1.6s_ease-out_infinite] rounded-full bg-primary" />
                      Ao vivo
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[34px] leading-none font-bold tracking-[-0.03em]">
                      {favPctLabel}
                    </span>
                    <span className="text-[13px] text-muted-foreground">
                      a favor · {totalLabel} votos
                    </span>
                  </div>
                  <div className="flex h-3 gap-0.5 overflow-hidden rounded-full">
                    {bars.map((bar) => (
                      <div
                        key={bar.key}
                        style={{ background: bar.color, width: `${bar.percent}%` }}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-3.5">
                    {bars.map((bar) => (
                      <span
                        key={bar.key}
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
                      >
                        <span
                          className="size-2.5 rounded-[3px]"
                          style={{ background: bar.color }}
                        />
                        {bar.label}{' '}
                        <span className="font-mono text-foreground">{bar.percentLabel}</span>
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Atualizado para todos em até 5 segundos
                  </span>
                </div>

                <div className={PANEL_CLASS} style={panelStyle(panelStyles[3])}>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold">Votação encerrada</span>
                    <Badge variant="secondary" className="h-auto rounded-full px-2.5 py-0.5 text-xs">
                      Encerrada
                    </Badge>
                  </div>
                  <p className="text-[13px] leading-relaxed text-muted-foreground">
                    Resultado consolidado: percentuais por opção, total de participantes e
                    comentários publicados.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-2 rounded-[16px] border border-primary bg-accent p-3.5">
                      <FileSpreadsheet className="size-5 text-accent-foreground" />
                      <span className="text-[13px] font-semibold">CSV</span>
                      <span className="text-[11px] text-muted-foreground">Para planilhas</span>
                    </div>
                    <div className="flex flex-col gap-2 rounded-[16px] border border-border p-3.5">
                      <FileText className="size-5 text-muted-foreground" />
                      <span className="text-[13px] font-semibold">PDF</span>
                      <span className="text-[11px] text-muted-foreground">Para divulgar</span>
                    </div>
                  </div>
                  <div className="mt-1 flex h-9.5 items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    <Download className="size-4" />
                    Exportar resultados
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* B + C */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Reveal className="flex flex-col gap-6 rounded-[31px] border border-white/12 bg-white/4 p-6 sm:p-10">
              <div>
                <h3 className="text-[22px] font-bold tracking-[-0.02em] text-white">
                  Moderação antes de publicar
                </h3>
                <p className="mt-2.5 max-w-[420px] text-[15px] leading-relaxed text-pretty text-white/90">
                  A triagem automática barra ofensa e spam na hora. O resto passa por um moderador
                  antes de aparecer na pauta.
                </p>
              </div>
              <div className="mt-auto flex min-h-[300px] flex-col gap-1 rounded-[24px] bg-white p-2">
                {moderationFeed.map((item) => (
                  <div
                    key={item.key}
                    className={cn(
                      'flex gap-3 rounded-[17px] p-3',
                      item.highlighted && 'animate-[row-in_.5s_cubic-bezier(.16,1,.3,1)] bg-muted/60'
                    )}
                  >
                    <Avatar className="shrink-0">
                      <AvatarImage src={item.src} alt="" />
                      <AvatarFallback style={{ background: item.bg, color: item.fg }}>
                        {item.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-semibold">{item.name}</span>
                        <span
                          className="inline-flex h-5 items-center gap-1 rounded-full px-2 text-[11px] font-semibold whitespace-nowrap"
                          style={{ background: item.statusBg, color: item.statusFg }}
                        >
                          <item.statusIcon className="size-3" />
                          {item.status}
                        </span>
                      </div>
                      <span
                        className={cn(
                          'text-[13px] leading-snug text-muted-foreground',
                          item.blurred && 'blur-[4px]'
                        )}
                      >
                        {item.text}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal
              delay={90}
              className="flex flex-col gap-6 rounded-[31px] border border-white/12 bg-white/4 p-6 sm:p-10"
            >
              <div>
                <h3 className="text-[22px] font-bold tracking-[-0.02em] text-white">
                  Todo mundo vê o mesmo número
                </h3>
                <p className="mt-2.5 max-w-[420px] text-[15px] leading-relaxed text-pretty text-white/90">
                  Cada voto chega a todas as telas conectadas sem recarregar a página — no celular
                  do morador ou no telão da associação.
                </p>
              </div>
              <div className="mt-auto flex min-h-[300px] flex-col justify-center gap-2.5">
                {syncClients.map((client) => (
                  <div
                    key={client.name}
                    className="flex items-center gap-3.5 rounded-[20px] bg-white px-4 py-3.5"
                  >
                    <span className="flex size-9.5 shrink-0 items-center justify-center rounded-[12px] bg-muted">
                      <client.icon className="size-4.5" />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <div className="flex justify-between gap-2 text-[13px]">
                        <span className="font-semibold">{client.name}</span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {client.latencyLabel}
                        </span>
                      </div>
                      <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full">
                        {bars.map((bar) => (
                          <div
                            key={bar.key}
                            style={{ background: bar.color, width: `${bar.percent}%` }}
                          />
                        ))}
                      </div>
                    </div>
                    <span
                      key={client.flashKey}
                      className="animate-[value-flash_1s_ease-out] rounded-[6px] px-1.5 py-0.5 font-mono text-sm font-medium"
                    >
                      {favPctLabel}
                    </span>
                  </div>
                ))}
                <div className="mt-1.5 flex items-center justify-center gap-2 text-xs text-white/90">
                  <span className="size-1.5 animate-[live-pulse_1.6s_ease-out_infinite] rounded-full bg-primary" />
                  {totalLabel} votos sincronizados
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal className="mt-2 flex justify-center">
            <Button
              size="lg"
              className="h-[50px] gap-2.5 rounded-full bg-white px-6.5 text-base font-semibold text-foreground shadow-[0_10px_30px_-10px_rgba(0,0,0,.5)] hover:bg-white/90"
            >
              Levar para minha comunidade
              <ChevronRight className="size-4" />
            </Button>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
