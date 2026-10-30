import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'

import { toast } from '@/components/ui/toast'
import { signOut } from '@/lib/auth/client'

export function useSignOut() {
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    const { error } = await signOut()
    setSigningOut(false)

    if (error) {
      toast.add({ type: 'error', title: 'Não foi possível sair', description: 'Tente novamente em instantes.' })
      return
    }
    navigate({ to: '/entrar' })
  }

  return { signingOut, handleSignOut }
}
