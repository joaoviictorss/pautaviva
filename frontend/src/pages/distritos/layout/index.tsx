import { Link } from '@tanstack/react-router'
import { ArrowRightIcon, ConstructionIcon, MapPinIcon } from 'lucide-react'

import { CommunityNavigation } from '@/components/community-navigation'
import { SiteHeader } from '@/components/site-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import type { DistritosLayoutProps } from '../data'

export function Distritos(_props: DistritosLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <CommunityNavigation active="distritos">
        <header className="flex flex-col gap-2">
          <h1 className="m-0 text-3xl font-bold tracking-tight">Distritos</h1>
          <p className="m-0 text-muted-foreground">Informações e pautas organizadas por região.</p>
        </header>

        <Card className="mx-auto w-full max-w-2xl rounded-2xl">
          <CardHeader className="items-center text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <ConstructionIcon className="size-7" />
            </span>
            <Badge variant="outline" className="mt-2">Em manutenção</Badge>
            <CardTitle className="text-2xl">Esta área está em manutenção</CardTitle>
            <CardDescription>
              Estamos preparando a organização das pautas por distrito. Enquanto isso, você pode consultar todas as pautas disponíveis.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button nativeButton={false} render={<Link to="/pautas" />}>
              <MapPinIcon />
              Consultar pautas
              <ArrowRightIcon />
            </Button>
          </CardContent>
        </Card>
      </CommunityNavigation>
    </div>
  )
}
