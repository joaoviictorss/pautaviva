import { Link } from '@tanstack/react-router'
import { ArrowRightIcon, ConstructionIcon, MapPinIcon } from 'lucide-react'

import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'

import type { DistritosLayoutProps } from '../data'

export function Distritos(_props: DistritosLayoutProps) {
  return (
    <section className="flex animate-[word-in_.35s_cubic-bezier(.16,1,.3,1)] flex-col gap-6">
      <PageHeader title="Distritos" description="Informações e pautas organizadas por região." />

      <Empty className="rounded-2xl border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon"><ConstructionIcon /></EmptyMedia>
          <EmptyTitle>Esta área está em manutenção</EmptyTitle>
          <EmptyDescription>
            Estamos preparando a organização das pautas por distrito. Enquanto isso, você pode consultar todas as pautas disponíveis.
          </EmptyDescription>
        </EmptyHeader>
        <Button nativeButton={false} render={<Link to="/pautas" />} className="h-10 rounded-full px-5 font-semibold">
          <MapPinIcon />
          Consultar pautas
          <ArrowRightIcon />
        </Button>
      </Empty>
    </section>
  )
}
