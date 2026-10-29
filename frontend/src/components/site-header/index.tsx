import { useSession } from '@/lib/auth/client'

import { SiteHeader as Layout } from './layout'
import type { SiteHeaderLayoutProps, SiteHeaderProps } from './data'

export function SiteHeader(_props: SiteHeaderProps) {
  const { data, isPending } = useSession()

  const layoutProps: SiteHeaderLayoutProps = {
    loading: isPending,
    signedIn: !!data,
    user: data?.user
      ? {
          name: data.user.name,
          email: data.user.email,
          image: data.user.image ?? null,
          role: data.user.role ?? 'CITIZEN',
        }
      : undefined,
  }

  return <Layout {...layoutProps} />
}
