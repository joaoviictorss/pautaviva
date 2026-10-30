import { Reveal } from '@/components/reveal'

import type { GuaranteesLayoutProps } from '../data'

export function Guarantees({ guarantees }: GuaranteesLayoutProps) {
  return (
    <section className="w-full px-3.5 py-10 sm:px-10 md:py-16">
      <Reveal className="grid grid-cols-1 gap-8 rounded-[31px] bg-accent p-7 sm:grid-cols-2 md:p-12 lg:grid-cols-4">
        <div className="flex flex-col gap-2.5">
          <h2 className="text-[clamp(1.5rem,2.6vw,2rem)] leading-[1.15] font-bold text-balance tracking-[-0.03em]">
            Resultado em que dá pra confiar
          </h2>
          <p className="text-[15px] leading-relaxed text-accent-foreground">
            Regras claras de votação, aplicadas igual para todo mundo.
          </p>
        </div>
        {guarantees.map((guarantee) => (
          <div key={guarantee.title} className="flex flex-col gap-2.5">
            <guarantee.icon className="size-5.5 text-accent-foreground" />
            <h3 className="text-base font-bold">{guarantee.title}</h3>
            <p className="text-sm leading-[1.55] text-pretty text-accent-foreground">
              {guarantee.description}
            </p>
          </div>
        ))}
      </Reveal>
    </section>
  )
}
