import { CheckIcon } from 'lucide-react'

import { Reveal } from '@/components/reveal'

import type { MobileShowcaseLayoutProps } from '../data'

export function MobileShowcase({ items }: MobileShowcaseLayoutProps) {
  return (
    <section className="w-full px-3.5 pt-12 sm:px-10 md:pt-24">
      <div className="flex flex-wrap items-center gap-12 md:gap-16">
        <Reveal className="relative min-w-0 max-w-[520px] flex-1 basis-[360px]">
          <div className="relative aspect-4/5 w-full overflow-hidden rounded-[31px] bg-muted">
            <img
              src="/morador-celular.png"
              alt="Moradora votando pelo celular na praça do bairro"
              className="size-full object-cover"
            />
          </div>
          <div className="pointer-events-none absolute right-[-10px] bottom-10 flex w-[236px] animate-[float-y_7s_ease-in-out_infinite] flex-col gap-1.5 rounded-[18px] bg-card p-3.5 shadow-[0_18px_36px_-12px_rgba(0,0,0,.3),0_0_0_1px_rgba(0,0,0,.05)]">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-accent">
                <CheckIcon className="size-3.5 text-accent-foreground" />
              </span>
              <span className="text-[13px] font-bold">Voto registrado</span>
            </div>
            <span className="text-xs text-muted-foreground">
              Seu voto é sigiloso. O resultado já foi atualizado.
            </span>
          </div>
        </Reveal>

        <Reveal delay={100} className="min-w-0 flex-1 basis-[380px]">
          <span className="text-sm font-semibold text-accent-foreground">
            Participe de onde estiver
          </span>
          <h2 className="mt-3 text-[clamp(1.875rem,3.6vw,2.75rem)] leading-[1.1] font-bold text-balance tracking-[-0.035em]">
            Não deu pra ir na reunião? Seu voto conta igual.
          </h2>
          <p className="mt-4 max-w-[480px] text-lg leading-relaxed text-pretty text-muted-foreground">
            Sem horário marcado e sem deslocamento. A pauta fica aberta pelo período definido, e
            você participa pelo navegador, do celular ou do computador.
          </p>
          <ul className="mt-8 flex list-none flex-col border-t border-border p-0">
            {items.map((item) => (
              <li
                key={item.title}
                className="grid grid-cols-[minmax(0,180px)_minmax(0,1fr)] gap-x-6 gap-y-2 border-b border-border py-4.5"
              >
                <span className="text-base font-bold">{item.title}</span>
                <span className="text-[15px] leading-relaxed text-pretty text-muted-foreground">
                  {item.description}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}
