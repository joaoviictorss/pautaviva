import type { LandingLayoutProps } from '../data'

export function Landing({
  header,
  hero,
  roles,
  features,
  results,
  mobileShowcase,
  howItWorks,
  guarantees,
  faq,
  ctaFinal,
  footer,
  mobileStickyBar,
}: LandingLayoutProps) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      {header}
      <main>
        {hero}
        {roles}
        {features}
        {results}
        {mobileShowcase}
        {howItWorks}
        {guarantees}
        {faq}
        {ctaFinal}
      </main>
      {mobileStickyBar}
      {footer}
    </div>
  )
}
