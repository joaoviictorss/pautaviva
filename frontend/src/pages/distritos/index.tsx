import { Distritos as Layout } from './layout'
import type { DistritosLayoutProps, DistritosProps } from './data'

export function Distritos(_props: DistritosProps) {
  const layoutProps: DistritosLayoutProps = {}
  return <Layout {...layoutProps} />
}
