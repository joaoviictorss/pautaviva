import { CheckIcon, CircleAlertIcon, DownloadIcon, ImagesIcon, InfoIcon, LockIcon, Trash2Icon, UploadIcon } from 'lucide-react'

import { PageHeader } from '@/components/page-header'
import { PasswordInput } from '@/components/password-input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/utils/format'

import type { ConfiguracoesLayoutProps } from '../data'

const CARD_TITLE = 'm-0 text-[17px] font-bold tracking-tight'
const PILL = 'h-10 rounded-full px-4 font-semibold'
const FIELD = 'flex min-w-0 flex-col gap-1.5'
const INPUT = 'h-11 rounded-[14px]'
const ERROR = 'text-[13px] text-destructive'
const ROW = 'flex flex-wrap items-center gap-4 border-t py-3.5'

export function Configuracoes({
  user,
  citizen,
  loading,
  error,
  onRetry,
  draft,
  profileErrors,
  avatarSrc,
  gallery,
  galleryOpen,
  uploadError,
  dirty,
  emailChanged,
  savingProfile,
  onDraftChange,
  onToggleGallery,
  onUpload,
  onDiscard,
  onSaveProfile,
  notifications,
  onNotificationChange,
  passwordFields,
  passwordRules,
  passwordAgeLabel,
  savingPassword,
  onSavePassword,
  exporting,
  onExport,
  deleteOpen,
  deleteText,
  deleting,
  onDeleteOpenChange,
  onDeleteTextChange,
  onDelete,
}: ConfiguracoesLayoutProps) {
  return (
    <section className="flex animate-[word-in_.35s_cubic-bezier(.16,1,.3,1)] flex-col gap-6">
      <PageHeader title="Configurações" description="Seu perfil, notificações e segurança da conta." />

      {error && (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertTitle>Não foi possível carregar seus dados</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={onRetry}>Tentar novamente</Button>
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : user && draft ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <Card className="rounded-2xl p-6">
            <form noValidate onSubmit={onSaveProfile} className="flex h-full flex-col gap-5">
              <h2 className={CARD_TITLE}>Perfil</h2>

              <div className="flex flex-wrap items-center gap-5">
                <Avatar className="size-22">
                  <AvatarImage src={avatarSrc} alt="Sua foto de perfil" />
                  <AvatarFallback>{getInitials(draft.name || user.name)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2.5">
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" aria-expanded={galleryOpen} className={PILL} onClick={onToggleGallery}>
                      <ImagesIcon />
                      Escolher avatar
                    </Button>
                    <Button type="button" variant="outline" nativeButton={false} render={<label />} className={`${PILL} cursor-pointer`}>
                      <UploadIcon />
                      Enviar foto
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="sr-only"
                        onChange={(event) => {
                          const file = event.currentTarget.files?.[0]
                          if (file) onUpload(file)
                          event.currentTarget.value = ''
                        }}
                      />
                    </Button>
                    {draft.image && (
                      <Button type="button" variant="ghost" className={`${PILL} text-muted-foreground`} onClick={() => onDraftChange({ image: null })}>
                        Remover
                      </Button>
                    )}
                  </div>
                  <span className={cn('text-xs text-muted-foreground', uploadError && 'text-destructive')}>
                    {uploadError ?? 'PNG, JPG ou WEBP até 2 MB.'}
                  </span>
                </div>
              </div>

              {galleryOpen && (
                <div role="radiogroup" aria-label="Avatares" className="grid grid-cols-[repeat(auto-fill,minmax(56px,1fr))] gap-2.5 rounded-2xl bg-muted/60 p-3.5">
                  {gallery.map((src, index) => (
                    <button
                      key={src}
                      type="button"
                      role="radio"
                      aria-checked={draft.image === src}
                      aria-label={`Avatar ${index + 1}`}
                      onClick={() => onDraftChange({ image: src })}
                      className={cn(
                        'relative size-14 cursor-pointer justify-self-center rounded-full ring-2 ring-transparent ring-offset-2 ring-offset-transparent',
                        draft.image === src && 'ring-primary',
                      )}
                    >
                      <img src={src} alt="" className="size-14 rounded-full bg-muted object-cover" />
                      {draft.image === src && (
                        <span className="absolute -right-0.5 -bottom-0.5 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                          <CheckIcon className="size-3" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-4">
                <div className={FIELD}>
                  <Label htmlFor="settings-name">Nome completo</Label>
                  <Input
                    id="settings-name"
                    autoComplete="name"
                    className={INPUT}
                    value={draft.name}
                    aria-invalid={!!profileErrors.name}
                    onChange={(event) => onDraftChange({ name: event.target.value })}
                  />
                  {profileErrors.name && <span className={ERROR}>{profileErrors.name}</span>}
                </div>
                <div className={FIELD}>
                  <Label htmlFor="settings-email">E-mail</Label>
                  <Input
                    id="settings-email"
                    type="email"
                    autoComplete="email"
                    className={INPUT}
                    value={draft.email}
                    aria-invalid={!!profileErrors.email}
                    onChange={(event) => onDraftChange({ email: event.target.value })}
                  />
                  {profileErrors.email && <span className={ERROR}>{profileErrors.email}</span>}
                </div>
                {user.cpf && (
                  <div className={FIELD}>
                    <span className="text-sm font-medium">CPF</span>
                    <div className="flex h-11 items-center justify-between rounded-[14px] border bg-muted/60 px-3.5 font-mono text-sm text-muted-foreground">
                      {user.cpf}
                      <LockIcon className="size-3.5" />
                    </div>
                    <span className="text-xs text-muted-foreground">O CPF garante um voto por pessoa e não pode ser alterado.</span>
                  </div>
                )}
              </div>

              {emailChanged && (
                <p className="m-0 flex gap-2.5 rounded-[14px] bg-blue-50 px-3.5 py-3 text-[13px] leading-normal text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
                  Ao salvar, enviaremos um link de confirmação para o novo e-mail. O antigo continua valendo até a confirmação.
                </p>
              )}

              <div className="mt-auto flex flex-wrap items-center justify-end gap-2.5 border-t pt-4">
                <span className={cn('flex-1 text-[13px] text-muted-foreground', dirty && 'font-semibold text-foreground')}>
                  {dirty ? 'Você tem alterações não salvas.' : 'Tudo salvo.'}
                </span>
                {dirty && (
                  <Button type="button" variant="ghost" className={PILL} disabled={savingProfile} onClick={onDiscard}>
                    Descartar
                  </Button>
                )}
                <Button type="submit" className={PILL} disabled={!dirty || savingProfile}>
                  {savingProfile && <Spinner />}
                  {savingProfile ? 'Salvando…' : 'Salvar alterações'}
                </Button>
              </div>
            </form>
          </Card>

          {citizen && (
            <Card className="gap-1.5 rounded-2xl px-6 pt-6 pb-3">
              <h2 className={CARD_TITLE}>Notificações por e-mail</h2>
              <span className="pb-2.5 text-sm text-muted-foreground">Enviadas para {user.email}.</span>
              {notifications.map((item) => (
                <div key={item.key} className="flex items-center gap-4 border-t py-3.5">
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-sm font-semibold">{item.label}</span>
                    <span className="text-[13px] text-muted-foreground">{item.description}</span>
                  </div>
                  <Switch aria-label={item.label} checked={item.enabled} onCheckedChange={(enabled) => onNotificationChange(item.key, enabled)} />
                </div>
              ))}
            </Card>
          )}

          <Card className="rounded-2xl p-6">
            <form noValidate onSubmit={onSavePassword} className="flex h-full flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h2 className={CARD_TITLE}>Senha</h2>
                {passwordAgeLabel && <span className="text-sm text-muted-foreground">{passwordAgeLabel}</span>}
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,150px),1fr))] gap-4">
                {passwordFields.map(({ id, label, autoComplete, field }) => (
                  <div key={id} className={FIELD}>
                    <Label htmlFor={id}>{label}</Label>
                    <PasswordInput id={id} field={field} autoComplete={autoComplete} />
                    {field.error && <span className={ERROR}>{field.error}</span>}
                  </div>
                ))}
              </div>
              <div className="mt-auto flex flex-wrap items-center gap-3.5">
                {passwordRules.map((rule) => (
                  <span key={rule.label} className={cn('inline-flex items-center gap-1.5 text-[13px] text-muted-foreground', rule.met && 'text-emerald-700 dark:text-emerald-400')}>
                    <CheckIcon className="size-3.5" />
                    {rule.label}
                  </span>
                ))}
                <Button type="submit" variant="outline" className={`${PILL} ml-auto`} disabled={savingPassword}>
                  {savingPassword && <Spinner />}
                  Alterar senha
                </Button>
              </div>
            </form>
          </Card>

          {citizen && (
            <Card className="gap-1.5 rounded-2xl px-6 pt-6 pb-3">
              <h2 className={`${CARD_TITLE} pb-2.5`}>Privacidade e dados</h2>
              <div className={ROW}>
                <div className="flex min-w-55 flex-1 flex-col gap-0.5">
                  <span className="text-sm font-semibold">Baixar meus dados</span>
                  <span className="text-[13px] text-muted-foreground">Cópia do cadastro, participações e comentários (LGPD).</span>
                </div>
                <Button variant="outline" className={PILL} disabled={exporting} onClick={onExport}>
                  <DownloadIcon />
                  {exporting ? 'Gerando...' : 'Baixar'}
                </Button>
              </div>
              <div className={ROW}>
                <div className="flex min-w-55 flex-1 flex-col gap-0.5">
                  <span className="text-sm font-semibold text-destructive">Excluir minha conta</span>
                  <span className="text-[13px] text-muted-foreground">Remove seus dados pessoais e comentários. Os votos seguem anônimos na contagem.</span>
                </div>
                <Button variant="outline" className={`${PILL} text-destructive hover:text-destructive`} onClick={() => onDeleteOpenChange(true)}>
                  <Trash2Icon />
                  Excluir conta
                </Button>
              </div>
            </Card>
          )}

          <Dialog open={deleteOpen} onOpenChange={onDeleteOpenChange}>
            <DialogContent>
              <form onSubmit={onDelete} className="flex flex-col gap-4">
                <DialogHeader>
                  <DialogTitle>Excluir sua conta?</DialogTitle>
                  <DialogDescription>
                    Essa ação não pode ser desfeita, e o mesmo CPF não poderá ser cadastrado de novo. Para confirmar, digite{' '}
                    <span className="font-mono font-semibold text-foreground">EXCLUIR</span>.
                  </DialogDescription>
                </DialogHeader>
                <Input
                  aria-label="Digite EXCLUIR"
                  autoComplete="off"
                  className={INPUT}
                  value={deleteText}
                  onChange={(event) => onDeleteTextChange(event.target.value)}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" disabled={deleting} onClick={() => onDeleteOpenChange(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" variant="destructive" disabled={deleteText !== 'EXCLUIR' || deleting}>
                    {deleting && <Spinner />}
                    Excluir definitivamente
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      ) : null}
    </section>
  )
}
