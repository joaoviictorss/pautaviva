import { CircleAlertIcon, UsersIcon } from 'lucide-react'

import { FilterChips } from '@/components/filter-chips'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Role } from '@/lib/auth/roles'
import { cn } from '@/lib/utils'

import { CreateUserDialog } from '../components/create-user-dialog'
import type { AdminUsuariosLayoutProps } from '../data'

export function AdminUsuarios({
  canManage,
  filters,
  roleFilter,
  onRoleFilterChange,
  rows,
  loading,
  error,
  roleOptions,
  onRoleChange,
  onUserCreated,
  page,
  totalPages,
  total,
  onPageChange,
}: AdminUsuariosLayoutProps) {
  return (
    <section className="flex animate-[word-in_.35s_cubic-bezier(.16,1,.3,1)] flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 text-[clamp(28px,3.2vw,38px)] font-extrabold tracking-tighter">Usuários</h1>
          <p className="m-0 text-[15px] text-muted-foreground">
            {canManage ? 'Cadastre gestores e moderadores e altere perfis de acesso.' : 'Consulte as contas e os perfis de acesso.'}
          </p>
        </div>
        {canManage && <CreateUserDialog onCreated={onUserCreated} />}
      </div>

      <FilterChips label="Perfil" chips={filters} value={roleFilter} onChange={onRoleFilterChange} />

      {error ? (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card" aria-busy={loading}>
          <Table className="min-w-170">
            <TableHeader>
              <TableRow>
                <TableHead className="px-5 text-xs text-muted-foreground">Usuário</TableHead>
                <TableHead className="text-xs text-muted-foreground">Perfil</TableHead>
                <TableHead className="text-xs text-muted-foreground">Situação</TableHead>
                <TableHead className="pr-5 text-xs text-muted-foreground">Cadastro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9">
                        {row.image && <AvatarImage src={row.image} alt="" />}
                        <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">
                          {row.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="flex items-center gap-2 font-semibold">
                          {row.name}
                          {row.isSelf && (
                            <Badge className="bg-foreground text-[11px] font-semibold text-background">Você</Badge>
                          )}
                        </span>
                        <span className="text-[13px] text-muted-foreground">{row.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {/* O próprio perfil fica travado: a plataforma não pode ficar sem administrador (UC12, E02). */}
                      <Select
                        items={roleOptions}
                        value={row.role}
                        disabled={!canManage || row.isSelf || row.updating}
                        onValueChange={(value) => value && onRoleChange(row.id, value as Role)}
                      >
                        <SelectTrigger aria-label={`Perfil de ${row.name}`} className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roleOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {row.updating && <Spinner />}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn('gap-2 border-0 px-0 text-[13px]', row.pending && 'text-amber-700 dark:text-amber-400')}
                    >
                      <span className={cn('size-2 rounded-full', row.pending ? 'bg-amber-400' : 'bg-emerald-500')} />
                      {row.pending ? 'Convite pendente' : 'Ativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-5 text-[13px] whitespace-nowrap text-muted-foreground">{row.createdLabel}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!loading && rows.length === 0 && (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <UsersIcon />
                </EmptyMedia>
                <EmptyTitle>Nenhum usuário encontrado</EmptyTitle>
                <EmptyDescription>Ajuste a busca ou o filtro de perfil.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
        <span>Toda criação de conta e alteração de perfil fica registrada na trilha de auditoria.</span>
        {totalPages > 1 && (
          <div className="flex items-center gap-2 text-sm">
            <span>{total} usuários</span>
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              Anterior
            </Button>
            <span>
              {page} de {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
              Próxima
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
