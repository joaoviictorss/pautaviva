import { Header as Layout } from './layout'
import type { HeaderLayoutProps, HeaderProps, NavLink } from './data'

const NAV_LINKS: NavLink[] = [
  { href: '/pautas', label: 'Pautas' },
  { href: '#recursos', label: 'Recursos' },
  { href: '#resultados', label: 'Resultados' },
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#faq', label: 'Dúvidas' },
]

export function Header(_props: HeaderProps) {
  const layoutProps: HeaderLayoutProps = {
    navLinks: NAV_LINKS,
  }

  return <Layout {...layoutProps} />
}
