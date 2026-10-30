import { PlusIcon } from 'lucide-react'

import { Reveal } from '@/components/reveal'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

import type { FaqLayoutProps } from '../data'

export function Faq({ faqs, defaultOpen }: FaqLayoutProps) {
  return (
    <section id="faq" className="w-full scroll-mt-20 px-3.5 py-14 sm:px-10 md:py-22">
      <div className="flex flex-wrap items-start gap-10 md:gap-18">
        <Reveal className="max-w-[380px] flex-1 basis-[300px]">
          <span className="text-sm font-semibold text-accent-foreground">
            Perguntas frequentes
          </span>
          <h2 className="mt-4 text-[clamp(1.75rem,3.4vw,2.5rem)] leading-[1.12] font-bold text-balance tracking-[-0.035em]">
            Ficou alguma dúvida?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Se a sua não estiver aqui, crie a conta e veja uma pauta aberta por dentro.
          </p>
        </Reveal>

        <Reveal delay={100} className="min-w-0 flex-[1.6] basis-[420px] border-t border-border">
          <Accordion defaultValue={defaultOpen}>
            {faqs.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id}>
                <AccordionTrigger className="**:data-[slot=accordion-trigger-icon]:hidden items-center gap-4 py-5 text-base font-semibold hover:no-underline">
                  <span>{faq.question}</span>
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border transition-[transform,background-color] duration-200 group-aria-expanded/accordion-trigger:rotate-45 group-aria-expanded/accordion-trigger:bg-muted">
                    <PlusIcon className="size-3.5 text-muted-foreground" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pr-11 text-[15px] leading-relaxed text-pretty text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  )
}
