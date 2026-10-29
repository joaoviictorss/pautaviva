import { Link } from '@tanstack/react-router'
import { ArrowLeftIcon, CircleAlertIcon, CircleCheckIcon, ClipboardListIcon, VoteIcon } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { SiteHeader } from '@/components/site-header'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ROLE_LABELS } from '@/lib/auth/roles'
import { getInitials } from '@/lib/utils/format'

import type { ConfiguracoesLayoutProps } from '../data'

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b py-3 last:border-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="m-0 break-words font-medium">{value}</dd>
    </div>
  )
}

export function Configuracoes({
  user,
  loading,
  error,
  onRetry,
  savingPhoto,
  photoError,
  onPhotoChange,
  onRemovePhoto,
}: ConfiguracoesLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
        <Button render={<Link to="/painel" />} variant="link" className="w-fit px-0">
          <ArrowLeftIcon />
          Voltar ao painel
        </Button>

        <header className="flex flex-col gap-2">
          <h1 className="m-0 text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="m-0 text-muted-foreground">Dados da sua conta e resumo de atividade na plataforma.</p>
        </header>

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

        <section className="grid gap-4 sm:grid-cols-2" aria-label="Contadores da conta">
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <ClipboardListIcon className="size-5" />
              </span>
              <div>
                <CardDescription>Pautas criadas</CardDescription>
                <CardTitle className="text-2xl">{loading ? <Skeleton className="mt-1 h-8 w-12" /> : user?.pollsCreated ?? 0}</CardTitle>
              </div>
            </CardHeader>
          </Card>
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <VoteIcon className="size-5" />
              </span>
              <div>
                <CardDescription>Pautas votadas</CardDescription>
                <CardTitle className="text-2xl">{loading ? <Skeleton className="mt-1 h-8 w-12" /> : user?.pollsVoted ?? 0}</CardTitle>
              </div>
            </CardHeader>
          </Card>
        </section>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center gap-4">
            {loading ? (
              <Skeleton className="size-14 rounded-full" />
            ) : (
              <Avatar className="size-14">
                {user?.image && <AvatarImage src={user.image} alt="" />}
                <AvatarFallback>{getInitials(user?.name ?? '')}</AvatarFallback>
              </Avatar>
            )}
            <div className="flex flex-col gap-1">
              <CardTitle>Dados da conta</CardTitle>
              <CardDescription>Informações pessoais vinculadas ao seu acesso.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-12" />)}
              </div>
            ) : user ? (
              <div>
                <div className="mb-5 flex flex-col gap-2 border-b pb-5">
                  <label htmlFor="profile-photo" className="text-sm font-medium">Foto de perfil</label>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      id="profile-photo"
                      type="file"
                      accept="image/*"
                      disabled={savingPhoto}
                      onChange={(event) => {
                        const file = event.currentTarget.files?.[0]
                        if (file) onPhotoChange(file)
                        event.currentTarget.value = ''
                      }}
                      className="block max-w-full text-sm text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:font-medium file:text-primary-foreground hover:file:bg-primary/90 disabled:opacity-50"
                    />
                    {user.image && (
                      <Button type="button" variant="outline" size="sm" disabled={savingPhoto} onClick={onRemovePhoto}>
                        Apagar foto
                      </Button>
                    )}
                    {savingPhoto && <span className="text-sm text-muted-foreground">Salvando foto…</span>}
                  </div>
                  <p className="m-0 text-sm text-muted-foreground">Imagens de até 8 MB. A foto será reduzida para otimizar o carregamento.</p>
                  {photoError && (
                    <Alert variant="destructive">
                      <CircleAlertIcon />
                      <AlertDescription>{photoError}</AlertDescription>
                    </Alert>
                  )}
                </div>
                <dl className="m-0">
                  <InfoRow label="Nome" value={user.name} />
                  <InfoRow label="E-mail" value={user.email} />
                  <div className="flex flex-col gap-1 border-b py-3">
                    <dt className="text-sm text-muted-foreground">Confirmação do e-mail</dt>
                    <dd className="m-0">
                      <Badge variant={user.emailVerified ? 'secondary' : 'outline'}>
                        {user.emailVerified ? (
                          <><CircleCheckIcon /> Confirmado</>
                        ) : 'Pendente'}
                      </Badge>
                    </dd>
                  </div>
                  <InfoRow label="CPF" value={user.cpf ?? 'Não informado'} />
                  <InfoRow label="Perfil" value={ROLE_LABELS[user.role]} />
                  <InfoRow label="Conta criada em" value={format(new Date(user.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} />
                </dl>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
