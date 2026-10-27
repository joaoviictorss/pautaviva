import { ArrowRight, MessageCircleHeart, Radio, ShieldCheck, Timer } from 'lucide-react'

import { Reveal } from '@/components/reveal'
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

import type { HeroLayoutProps } from '../data'

export function Hero({
  rotatingWord,
  wordKey,
  avatars,
  totalLabel,
  countdownLabel,
  bars,
  voteOptions,
  voteMessage,
  recentVoters,
  participantsLabel,
  lastVoterName,
  lastVoterAvatar,
  pulse,
}: HeroLayoutProps) {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute top-[-20%] right-[-10%] h-[120%] w-[70%] bg-[radial-gradient(closest-side,var(--accent),transparent)]" />

      <div className="relative mx-auto flex max-w-6xl flex-wrap items-center gap-x-16 gap-y-12 px-6 py-14 md:py-20">
        <Reveal className="max-w-[560px] flex-1 basis-[400px]">
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className="h-auto gap-2 rounded-full border-border bg-background py-1 pr-3 pl-2 font-medium"
            >
              <span className="size-2 animate-[live-pulse_1.6s_ease-out_infinite] rounded-full bg-primary" />
              Resultados ao vivo
            </Badge>
            <Badge
              variant="outline"
              className="h-auto gap-1.5 rounded-full border-border bg-background px-3 py-1 font-medium"
            >
              <ShieldCheck className="size-3.5 text-primary" />
              Um CPF, um voto
            </Badge>
          </div>

          <h1 className="mt-6 text-[clamp(2.5rem,5vw,4rem)] leading-[1.04] font-bold text-balance tracking-[-0.04em]">
            Sua comunidade decide{' '}
            <span className="inline-grid align-bottom">
              <span
                key={wordKey}
                className="col-start-1 row-start-1 animate-[word-in_.4s_cubic-bezier(.16,1,.3,1)] font-serif font-medium text-primary italic"
              >
                {rotatingWord}
              </span>
              <span
                className="invisible col-start-1 row-start-1 font-serif font-medium italic"
                aria-hidden="true"
              >
                com transparência
              </span>
            </span>
          </h1>

          <p className="mt-5 max-w-[480px] text-lg leading-relaxed text-pretty text-muted-foreground">
            Proponha, discuta e vote nas pautas do seu bairro em um só lugar. Tudo registrado,
            moderado e com resultado atualizado na hora.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              className="h-[46px] gap-2 rounded-[22px] px-6 font-semibold shadow-[0_10px_24px_-10px_var(--primary)]"
            >
              Participar agora
              <ArrowRight className="size-4" />
            </Button>
            <a
              href="#resultados"
              className={cn(
                buttonVariants({
                  variant: 'outline',
                  size: 'lg',
                  className: 'h-[46px] rounded-[22px] px-5 font-semibold',
                })
              )}
            >
              Ver uma votação ao vivo
            </a>
          </div>

          <div className="mt-8 flex items-center gap-3.5">
            <AvatarGroup>
              {avatars.map((avatar) => (
                <Avatar key={avatar.name} className="size-9">
                  <AvatarImage src={avatar.src} alt="" />
                  <AvatarFallback style={{ background: avatar.bg, color: avatar.fg }}>
                    {avatar.initials}
                  </AvatarFallback>
                </Avatar>
              ))}
            </AvatarGroup>
            <p className="text-sm leading-snug text-muted-foreground">
              <span className="font-bold text-foreground">{totalLabel} vizinhos</span> já votaram
              <br />
              na pauta desta semana
            </p>
          </div>
        </Reveal>

        <Reveal
          delay={120}
          className="relative flex min-w-0 flex-1 basis-[440px] justify-center py-9"
        >
          <div className="pointer-events-none absolute inset-x-[10%] bottom-[8%] h-[40%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--primary)_35%,transparent),transparent)] blur-[28px]" />

          <div className="relative w-full max-w-[480px] overflow-hidden rounded-[31px] bg-card shadow-[0_0_0_1px_rgba(0,0,0,.08),0_40px_80px_-32px_rgba(120,50,20,.45)]">
            <div className="flex flex-col gap-3.5 px-6 pt-6 pb-5">
              <div className="flex items-center justify-between gap-3">
                <Badge variant="secondary" className="h-auto rounded-full px-2.5 py-0.5">
                  Mobilidade
                </Badge>
                <Badge className="h-auto gap-1.5 rounded-full bg-accent px-2.5 py-0.5 text-accent-foreground">
                  <span className="size-1.5 animate-[live-pulse_1.6s_ease-out_infinite] rounded-full bg-primary" />
                  Aberta
                </Badge>
              </div>

              <div>
                <h3 className="text-xl leading-snug font-bold tracking-tight">
                  Ciclofaixa na Av. Paulo VI
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  Proposta de faixa exclusiva para bicicletas entre a praça e a estação do metrô.
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                <Timer className="size-3.5" />
                Encerra em{' '}
                <span className="font-mono font-medium text-foreground">{countdownLabel}</span>
              </div>

              <div className="flex flex-col gap-3 pt-1.5">
                {bars.map((bar) => (
                  <div key={bar.key} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-[13px]">
                      <span className="font-medium">{bar.label}</span>
                      <span className="font-mono font-medium">{bar.percentLabel}</span>
                    </div>
                    <Progress
                      value={bar.percent}
                      className="**:data-[slot=progress-track]:h-2.5 **:data-[slot=progress-indicator]:bg-(--bar-color)"
                      style={{ '--bar-color': bar.color } as React.CSSProperties}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-1 grid grid-cols-3 gap-1.5 rounded-[17px] bg-muted p-1">
                {voteOptions.map((option) => (
                  <Button
                    key={option.key}
                    type="button"
                    variant="ghost"
                    onClick={option.onVote}
                    className={cn(
                      'h-9 rounded-[13px] text-[13px] font-semibold',
                      option.active
                        ? 'bg-primary text-primary-foreground shadow-[0_4px_12px_-4px_var(--primary)]'
                        : 'text-foreground hover:bg-background/60'
                    )}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
              <p className="min-h-[18px] text-xs text-muted-foreground">{voteMessage}</p>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/50 px-6 py-3.5">
              <div className="flex items-center gap-2.5">
                <AvatarGroup>
                  {recentVoters.map((avatar) => (
                    <Avatar key={avatar.name} className="size-7">
                      <AvatarImage src={avatar.src} alt="" />
                      <AvatarFallback style={{ background: avatar.bg, color: avatar.fg }}>
                        {avatar.initials}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </AvatarGroup>
                <span className="text-[13px] text-muted-foreground">
                  <span className="font-bold text-foreground">{participantsLabel}</span>{' '}
                  participantes
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Radio className="size-3.5 text-primary" />
                Ao vivo
              </span>
            </div>
          </div>

          <div className="pointer-events-none absolute top-0 right-0 flex animate-[float-y_7s_ease-in-out_infinite] items-center gap-2.5 rounded-full bg-card py-1.5 pr-3.5 pl-1.5 shadow-[0_14px_30px_-12px_rgba(0,0,0,.3),0_0_0_1px_rgba(0,0,0,.05)]">
            <Avatar key={pulse}>
              <AvatarImage src={lastVoterAvatar.src} alt="" />
              <AvatarFallback style={{ background: lastVoterAvatar.bg, color: lastVoterAvatar.fg }}>
                {lastVoterAvatar.initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-[13px] font-semibold">{lastVoterName} votou</span>
              <span className="text-[11px] text-muted-foreground">agora · voto sigiloso</span>
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-0 -left-2.5 flex w-[240px] animate-[float-y_8s_ease-in-out_-3s_infinite] gap-2.5 rounded-[18px] bg-card p-3.5 shadow-[0_18px_36px_-14px_rgba(0,0,0,.3),0_0_0_1px_rgba(0,0,0,.05)]">
            <span className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-accent">
              <MessageCircleHeart className="size-4 text-accent-foreground" />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-[13px] font-semibold">Comentário publicado</span>
              <span className="text-xs leading-snug text-muted-foreground">
                “Dá pra incluir iluminação perto da praça?”
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
