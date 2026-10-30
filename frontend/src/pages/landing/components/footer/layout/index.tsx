import type { FooterLayoutProps } from '../data'

export function Footer({ columns }: FooterLayoutProps) {
  return (
    <footer className="relative overflow-hidden border-t border-border bg-sidebar">
      <div className="relative w-full px-3.5 pt-12 sm:px-10 md:pt-18">
        <div className="flex flex-wrap justify-between gap-12">
          <div className="flex max-w-[380px] flex-1 basis-[280px] flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <img src="/logo-mark.svg" alt="" className="block size-9" />
              <span className="text-lg font-bold tracking-tight text-primary">PautaViva</span>
            </div>
            <p className="text-[15px] leading-relaxed text-pretty text-muted-foreground">
              Plataforma de participação comunitária para propor, discutir e votar as pautas do
              seu bairro.
            </p>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              Projeto de TCC · Engenharia da Computação
              <br />
              Universidade São Judas Tadeu
            </p>
          </div>

          <div className="flex flex-wrap gap-10 md:gap-16">
            {columns.map((column) => (
              <div key={column.title} className="flex flex-col gap-3.5">
                <span className="text-[13px] font-bold">{column.title}</span>
                {column.links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-sm text-foreground/85 no-underline hover:underline"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap justify-between gap-3 border-t border-border py-5.5 text-[13px] text-muted-foreground md:mt-14">
          <span>© 2026 PautaViva</span>
          <div className="flex gap-5">
            <a href="#" className="text-muted-foreground no-underline hover:underline">
              Termos de uso
            </a>
            <a href="#" className="text-muted-foreground no-underline hover:underline">
              Privacidade
            </a>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="mb-[-4px] text-center leading-[.8] font-extrabold tracking-[-0.06em] whitespace-nowrap text-transparent select-none"
          style={{
            fontSize: 'clamp(90px,11vw,300px)',
            backgroundImage:
              'linear-gradient(180deg, oklch(0.9 0.06 40) 0%, oklch(0.9 0.06 40 / 0) 92%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
          }}
        >
          PautaViva
        </div>
      </div>
    </footer>
  )
}
