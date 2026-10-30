import { ArrowRightIcon } from 'lucide-react'

import { Reveal } from '@/components/reveal'
import { Button } from '@/components/ui/button'

import type { CtaFinalLayoutProps } from '../data'

export function CtaFinal(_props: CtaFinalLayoutProps) {
  return (
    <section className="w-full px-3.5 pt-4 pb-16 sm:px-10 sm:pt-8 md:pb-24">
      <Reveal className="relative w-full overflow-hidden rounded-[40px] bg-[radial-gradient(90%_70%_at_20%_0%,oklch(0.72_0.19_45)_0%,transparent_60%),linear-gradient(165deg,var(--primary),oklch(0.5_0.18_33))]">
        <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:22px_22px]" />

        <div className="relative px-6 pt-12 text-center sm:pt-20">
          <h2 className="mx-auto max-w-[680px] text-[clamp(2rem,4.4vw,3.5rem)] leading-[1.05] font-bold text-balance text-white">
            A próxima decisão do bairro{' '}
            <span className="font-serif font-medium italic">passa por você</span>
          </h2>
          <p className="mx-auto mt-4.5 max-w-[460px] text-lg leading-relaxed text-white/90">
            Crie sua conta com CPF e e-mail e vote na primeira pauta ainda hoje.
          </p>
          <div className="mt-8 flex justify-center">
            <Button
              size="lg"
              className="h-[50px] gap-2.5 rounded-full bg-white px-6.5 text-base font-semibold text-foreground shadow-[0_10px_30px_-10px_rgba(0,0,0,.4)] hover:bg-white/90"
            >
              Criar minha conta
              <ArrowRightIcon className="size-4" />
            </Button>
          </div>

          <div className="mx-auto mt-14 h-[clamp(200px,30vw,340px)] max-w-[920px] overflow-hidden">
            <div className="h-full rounded-t-[26px] border border-b-0 border-white/28 bg-white/18 p-2.5 pb-0">
              <div className="relative h-[calc(100%+40px)] overflow-hidden rounded-t-[18px] bg-card">
                <img
                  src="/captura-pautas.png"
                  alt="Tela de pautas do PautaViva"
                  className="block size-full object-cover object-top"
                />
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
