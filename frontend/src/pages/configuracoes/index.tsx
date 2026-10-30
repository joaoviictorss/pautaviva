import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'

import { api } from '@/lib/api/client'
import { signOut, authClient } from '@/lib/auth/client'
import { toast } from '@/components/ui/toast'

import { Configuracoes as Layout } from './layout'
import type { ConfiguracoesLayoutProps, ConfiguracoesProps, UserSettings } from './data'

export function Configuracoes(_props: ConfiguracoesProps) {
  const navigate = useNavigate()
  const [user, setUser] = useState<UserSettings>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [savingPhoto, setSavingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState<string>()
  const [signingOut, setSigningOut] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setUser(await api<UserSettings>('/users/me'))
      setError(undefined)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os dados da conta.')
    } finally {
      setLoading(false)
    }
  }, [])

  const changePhoto = useCallback(async (file: File) => {
    setPhotoError(undefined)
    if (!file.type.startsWith('image/')) {
      setPhotoError('Selecione um arquivo de imagem.')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setPhotoError('A imagem deve ter no máximo 8 MB.')
      return
    }

    setSavingPhoto(true)
    try {
      const bitmap = await createImageBitmap(file)
      const scale = Math.min(1, 512 / Math.max(bitmap.width, bitmap.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(bitmap.width * scale))
      canvas.height = Math.max(1, Math.round(bitmap.height * scale))
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Não foi possível processar a imagem.')
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      bitmap.close()

      const image = await new Promise<string>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Não foi possível processar a imagem.'))
            return
          }
          const reader = new FileReader()
          reader.onload = () => resolve(String(reader.result))
          reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'))
          reader.readAsDataURL(blob)
        }, 'image/jpeg', 0.82)
      })

      const result = await authClient.updateUser({ image })
      if (result.error) throw new Error(result.error.message ?? 'Não foi possível atualizar a foto.')
      setUser((current) => current ? { ...current, image } : current)
    } catch (uploadError) {
      setPhotoError(uploadError instanceof Error ? uploadError.message : 'Não foi possível atualizar a foto.')
    } finally {
      setSavingPhoto(false)
    }
  }, [])

  const removePhoto = useCallback(async () => {
    setPhotoError(undefined)
    setSavingPhoto(true)
    try {
      const result = await authClient.updateUser({ image: null })
      if (result.error) throw new Error(result.error.message ?? 'Não foi possível apagar a foto.')
      setUser((current) => current ? { ...current, image: null } : current)
    } catch (removeError) {
      setPhotoError(removeError instanceof Error ? removeError.message : 'Não foi possível apagar a foto.')
    } finally {
      setSavingPhoto(false)
    }
  }, [])

  const handleSignOut = useCallback(async () => {
    setSigningOut(true)
    const { error: signOutError } = await signOut()
    setSigningOut(false)

    if (signOutError) {
      toast.add({ type: 'error', title: 'Não foi possível sair', description: 'Tente novamente em instantes.' })
      return
    }

    await navigate({ to: '/entrar' })
  }, [navigate])

  useEffect(() => {
    void load()
  }, [load])

  const layoutProps: ConfiguracoesLayoutProps = {
    user,
    loading,
    error,
    onRetry: () => void load(),
    savingPhoto,
    photoError,
    onPhotoChange: (file) => void changePhoto(file),
    onRemovePhoto: () => void removePhoto(),
    signingOut,
    onSignOut: () => void handleSignOut(),
  }

  return <Layout {...layoutProps} />
}
