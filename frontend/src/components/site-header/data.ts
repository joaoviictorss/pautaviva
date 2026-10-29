export interface SiteHeaderProps {}

export interface SiteHeaderLayoutProps extends SiteHeaderProps {
  loading: boolean
  signedIn: boolean
  user?: {
    name: string
    email: string
    image: string | null
    role: string
  }
}
