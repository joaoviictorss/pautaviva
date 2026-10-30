import { Reveal } from '@/components/reveal'

import type { HowItWorksLayoutProps } from '../data'

export function HowItWorks({ steps }: HowItWorksLayoutProps) {
  return (
    <section id="como-funciona" className="w-full scroll-mt-20 px-3.5 py-18 sm:px-10 md:py-32">
      <Reveal className="mx-auto flex max-w-[600px] flex-col items-center gap-3.5 text-center">
        <span className="text-sm font-semibold text-accent-foreground">Como funciona</span>
        <h2 className="text-[clamp(1.75rem,3.4vw,2.625rem)] leading-[1.12] font-bold text-balance tracking-[-0.035em]">
          Do cadastro ao primeiro voto em quatro passos
        </h2>
      </Reveal>

      <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => (
          <Reveal
            key={step.n}
            delay={step.delayMs}
            className="flex flex-col gap-3.5 rounded-[31px] bg-card p-6 shadow-[0_0_0_1px_rgba(0,0,0,.1)]"
          >
            <div className="flex items-center justify-between">
              <span className="flex size-11 items-center justify-center rounded-[14px] bg-accent">
                <step.icon className="size-5.5 text-accent-foreground" />
              </span>
              <span className="font-mono text-[13px] text-muted-foreground">{step.n}</span>
            </div>
            <div>
              <h3 className="text-[17px] leading-snug font-bold tracking-[-0.01em]">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-pretty text-muted-foreground">
                {step.description}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
