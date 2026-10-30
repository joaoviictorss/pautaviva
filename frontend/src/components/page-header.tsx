import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: ReactNode
  description: ReactNode
  /** Ações à direita do título. */
  children?: ReactNode
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="m-0 text-[clamp(28px,3.2vw,38px)] font-extrabold tracking-tighter">{title}</h1>
        <p className="m-0 text-[15px] text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  )
}
