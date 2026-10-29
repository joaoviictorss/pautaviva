import { useSession } from '@/lib/auth/client'

import { SiteHeader as Layout } from './layout'
import type { SiteHeaderLayoutProps, SiteHeaderProps } from './data'

export function SiteHeader(_props: SiteHeaderProps) {
  const { data, isPending } = useSession()

  const layoutProps: SiteHeaderLayoutProps = {
    loading: isPending,
    signedIn: !!data,
  }

  return <Layout {...layoutProps} />
}
