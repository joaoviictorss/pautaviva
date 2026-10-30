import { useCallback, useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useForm } from 'react-hook-form'

import { toast } from '@/components/ui/toast'
import { api } from '@/lib/api/client'
import { authClient, verifyEmailCallbackUrl } from '@/lib/auth/client'
import { formField } from '@/lib/form/field'
import { fetchAllParticipations } from '@/lib/poll/participations'
import type { MyComment } from '@/lib/poll/types'
import { getAvatarUrl, getDefaultAvatar } from '@/lib/utils/avatar'
import { downloadFile } from '@/lib/utils/download'

import { Configuracoes as Layout } from './layout'
import type {
  ConfiguracoesLayoutProps,
  ConfiguracoesProps,
  NotificationKey,
  PasswordDraft,
  ProfileDraft,
  UserSettings,
} from './data'

const GALLERY = Array.from({ length: 12 }, (_, index) => getAvatarUrl(index + 1))
const MAX_PHOTO_BYTES = 2 * 1024 * 1024
const PHOTO_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const EMPTY_PASSWORD: PasswordDraft = { current: '', next: '', confirmation: '' }

const NOTIFICATIONS: { key: NotificationKey; label: string; description: string }[] = [
  { key: 'notifyPollOpened', label: 'Nova pauta aberta', description: 'Quando uma votação abrir.' },
  { key: 'notifyPollClosing', label: 'Votação encerrando', description: '24 h antes do fim, se você ainda não votou.' },
  { key: 'notifyPollResult', label: 'Resultado publicado', description: 'Quando sai o resultado de uma pauta em que você votou.' },
  { key: 'notifyComments', label: 'Seus comentários', description: 'Quando um comentário seu for aprovado ou não aprovado.' },
]

/** Reduz para 512px: a foto fica salva no próprio cadastro. */
async function toProfilePhoto(file: File) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 512 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Não foi possível processar a imagem.')
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', 0.82)
}

const toDraft = ({ name, email, image }: UserSettings): ProfileDraft => ({ name, email, image })

export function Configuracoes(_props: ConfiguracoesProps) {
  const [user, setUser] = useState<UserSettings>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [draft, setDraft] = useState<ProfileDraft>()
  const [profileErrors, setProfileErrors] = useState<ConfiguracoesLayoutProps['profileErrors']>({})
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [uploadError, setUploadError] = useState<string>()
  const [savingProfile, setSavingProfile] = useState(false)
  const passwordForm = useForm<PasswordDraft>({ defaultValues: EMPTY_PASSWORD })
  const [exporting, setExporting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteText, setDeleteText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const settings = await api<UserSettings>('/users/me')
      setUser(settings)
      setDraft(toDraft(settings))
      setError(undefined)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os dados da conta.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const name = draft?.name.trim() ?? ''
  const email = draft?.email.trim().toLowerCase() ?? ''
  const emailChanged = !!user && email !== user.email
  const dirty = !!user && !!draft && (name !== user.name || emailChanged || draft.image !== user.image)
  const nextPassword = passwordForm.watch('next')
  const hasLength = nextPassword.length >= 8
  const hasNumber = /\d/.test(nextPassword)

  async function upload(file: File) {
    if (!PHOTO_TYPES.includes(file.type)) return setUploadError('Use uma imagem PNG, JPG ou WEBP.')
    if (file.size > MAX_PHOTO_BYTES) return setUploadError('A imagem deve ter no máximo 2 MB.')
    try {
      const image = await toProfilePhoto(file)
      setDraft((current) => current && { ...current, image })
      setUploadError(undefined)
      setGalleryOpen(false)
    } catch (photoError) {
      setUploadError(photoError instanceof Error ? photoError.message : 'Não foi possível processar a imagem.')
    }
  }

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault()
    if (!user || !draft || !dirty) return

    const errors: ConfiguracoesLayoutProps['profileErrors'] = {}
    if (name.split(/\s+/).length < 2) errors.name = 'Informe nome e sobrenome.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = 'Informe um e-mail válido.'
    setProfileErrors(errors)
    if (Object.keys(errors).length) return

    setSavingProfile(true)
    try {
      if (name !== user.name || draft.image !== user.image) {
        const result = await authClient.updateUser({ name, image: draft.image })
        if (result.error) throw new Error(result.error.message ?? 'Não foi possível salvar o perfil.')
      }
      if (emailChanged) {
        const result = await authClient.changeEmail({ newEmail: email, callbackURL: verifyEmailCallbackUrl() })
        if (result.error) throw new Error(result.error.message ?? 'Não foi possível alterar o e-mail.')
      }
      const saved = { ...user, name, image: draft.image }
      setUser(saved)
      setDraft(toDraft(saved))
      toast.add({
        type: 'success',
        title: 'Perfil atualizado',
        description: emailChanged ? `Enviamos um link de confirmação para ${email}.` : 'Suas alterações foram salvas.',
      })
    } catch (saveError) {
      toast.add({ type: 'error', title: 'Não foi possível salvar', description: (saveError as Error).message })
    } finally {
      setSavingProfile(false)
    }
  }

  async function changeNotification(key: NotificationKey, enabled: boolean) {
    setUser((current) => current && { ...current, [key]: enabled })
    try {
      await api('/users/me/notifications', { method: 'PATCH', json: { [key]: enabled } })
    } catch (saveError) {
      setUser((current) => current && { ...current, [key]: !enabled })
      toast.add({ type: 'error', title: 'Não foi possível salvar a preferência', description: (saveError as Error).message })
    }
  }

  async function savePassword({ current, next }: PasswordDraft) {
    const result = await authClient.changePassword({ currentPassword: current, newPassword: next, revokeOtherSessions: true })

    if (result.error) {
      if (result.error.code === 'INVALID_PASSWORD') passwordForm.setError('current', { message: 'Senha atual incorreta.' })
      else toast.add({ type: 'error', title: 'Não foi possível alterar a senha', description: result.error.message })
      return
    }
    passwordForm.reset()
    setUser((current) => current && { ...current, passwordChangedAt: new Date().toISOString() })
    toast.add({ type: 'success', title: 'Senha alterada', description: 'Use a nova senha no próximo acesso.' })
  }

  async function exportData() {
    if (!user) return
    setExporting(true)
    try {
      const [participations, comments] = await Promise.all([fetchAllParticipations(), api<MyComment[]>('/comments/me')])
      const data = {
        cadastro: { nome: user.name, email: user.email, cpf: user.cpf },
        // só a participação: a opção de voto não fica associada à pessoa
        participacoes: participations.map(({ participatedAt, poll }) => ({ pauta: poll.title, categoria: poll.category.name, data: participatedAt })),
        comentarios: comments.map(({ text, status, createdAt, poll }) => ({ pauta: poll.title, texto: text, situacao: status, data: createdAt })),
      }
      downloadFile('meus-dados-pautaviva.json', [JSON.stringify(data, null, 2)], 'application/json')
    } catch (exportError) {
      toast.add({ type: 'error', title: 'Não foi possível baixar seus dados', description: (exportError as Error).message })
    } finally {
      setExporting(false)
    }
  }

  async function deleteAccount(event: React.FormEvent) {
    event.preventDefault()
    if (deleteText !== 'EXCLUIR') return
    setDeleting(true)
    try {
      await api('/users/me', { method: 'DELETE' })
      window.location.assign('/')
    } catch (deleteError) {
      setDeleting(false)
      toast.add({ type: 'error', title: 'Não foi possível excluir a conta', description: (deleteError as Error).message })
    }
  }

  const layoutProps: ConfiguracoesLayoutProps = {
    user,
    citizen: user?.role === 'CITIZEN',
    loading,
    error,
    onRetry: () => void load(),
    draft,
    profileErrors,
    avatarSrc: draft?.image ?? getDefaultAvatar(draft?.name ?? ''),
    gallery: GALLERY,
    galleryOpen,
    uploadError,
    dirty,
    emailChanged,
    savingProfile,
    onDraftChange: (values) => setDraft((current) => current && { ...current, ...values }),
    onToggleGallery: () => setGalleryOpen((current) => !current),
    onUpload: (file) => void upload(file),
    onDiscard: () => {
      if (user) setDraft(toDraft(user))
      setProfileErrors({})
      setUploadError(undefined)
    },
    onSaveProfile: (event) => void saveProfile(event),
    notifications: NOTIFICATIONS.map((item) => ({ ...item, enabled: !!user?.[item.key] })),
    onNotificationChange: (key, enabled) => void changeNotification(key, enabled),
    passwordFields: [
      {
        id: 'settings-current-password',
        label: 'Senha atual',
        autoComplete: 'current-password',
        field: formField(passwordForm, 'current', { required: 'Informe a senha atual.' }),
      },
      {
        id: 'settings-new-password',
        label: 'Nova senha',
        autoComplete: 'new-password',
        field: formField(passwordForm, 'next', {
          validate: (value, { current }) => {
            if (value.length < 8 || !/\d/.test(value)) return 'A nova senha não atende aos requisitos.'
            return value !== current || 'Use uma senha diferente da atual.'
          },
        }),
      },
      {
        id: 'settings-confirm-password',
        label: 'Confirmar nova senha',
        autoComplete: 'new-password',
        field: formField(passwordForm, 'confirmation', {
          validate: (value, { next }) => (!!value && value === next) || 'As senhas não coincidem.',
        }),
      },
    ],
    passwordRules: [
      { label: 'Mínimo de 8 caracteres', met: hasLength },
      { label: 'Pelo menos um número', met: hasNumber },
    ],
    passwordAgeLabel: user?.passwordChangedAt
      ? `Última alteração ${formatDistanceToNow(new Date(user.passwordChangedAt), { addSuffix: true, locale: ptBR })}.`
      : undefined,
    savingPassword: passwordForm.formState.isSubmitting,
    onSavePassword: (event) => void passwordForm.handleSubmit(savePassword)(event),
    exporting,
    onExport: () => void exportData(),
    deleteOpen,
    deleteText,
    deleting,
    onDeleteOpenChange: (open) => {
      setDeleteOpen(open)
      setDeleteText('')
    },
    onDeleteTextChange: setDeleteText,
    onDelete: (event) => void deleteAccount(event),
  }

  return <Layout {...layoutProps} />
}
