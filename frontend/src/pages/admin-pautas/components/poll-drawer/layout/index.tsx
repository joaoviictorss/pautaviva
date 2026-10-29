import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

import type { PollDrawerLayoutProps } from '../data'

export function PollDrawer({
  open,
  onOpenChange,
  editing,
  title,
  description,
  start,
  end,
  categoryId,
  onCategoryChange,
  categoryOptions,
  categoryError,
  preview,
  loading,
  onSubmit,
}: PollDrawerLayoutProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 data-[side=right]:sm:max-w-125">
        <form onSubmit={onSubmit} noValidate className="flex h-full flex-col">
          <SheetHeader className="gap-1.5 px-6 pt-6 pb-4">
            <SheetTitle className="text-2xl font-bold tracking-tight">{editing ? 'Editar pauta' : 'Nova pauta'}</SheetTitle>
            <SheetDescription className="text-sm leading-relaxed">
              {editing
                ? 'Só pautas agendadas podem ser editadas, antes do início da votação.'
                : 'A pauta abre para votação na data de início.'}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-4.5 overflow-auto px-6 pt-2 pb-6">
            <Field>
              <FieldLabel htmlFor="p-title">Título</FieldLabel>
              <Input
                id="p-title"
                placeholder="Ex.: Mais áreas verdes no centro"
                maxLength={90}
                aria-invalid={!!title.error}
                className="h-11"
                {...title.register}
              />
              {editing && <FieldDescription>Todos os dados podem ser alterados enquanto a pauta estiver agendada.</FieldDescription>}
              <FieldError>{title.error}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="p-desc">Descrição</FieldLabel>
              <Textarea
                id="p-desc"
                rows={5}
                placeholder="Explique a proposta, o contexto e o que muda para o bairro."
                aria-invalid={!!description.error}
                {...description.register}
              />
              <FieldError>{description.error}</FieldError>
            </Field>

            <Field>
              <FieldLabel id="p-cat-label">Categoria</FieldLabel>
              <ToggleGroup
                aria-labelledby="p-cat-label"
                variant="outline"
                className="flex-wrap"
                value={categoryId ? [categoryId] : []}
                onValueChange={(values) => values[0] && onCategoryChange(values[0])}
              >
                {categoryOptions.map((option) => (
                  <ToggleGroupItem
                    key={option.id}
                    value={option.id}
                    aria-invalid={!!categoryError}
                    style={option.selected ? { ...option.look.style, borderColor: option.look.style.color } : undefined}
                    className="h-8.5 gap-1.5 rounded-full bg-card pr-3 pl-2.5 text-[13px] font-semibold"
                  >
                    <option.look.icon className="size-3.5" />
                    {option.name}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <FieldError>{categoryError}</FieldError>
            </Field>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3.5">
              <Field>
                <FieldLabel htmlFor="p-start">Início da votação</FieldLabel>
                <Input id="p-start" type="date" aria-invalid={!!start.error} className="h-11" {...start.register} />
                <FieldError>{start.error}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="p-end">Término da votação</FieldLabel>
                <Input id="p-end" type="date" aria-invalid={!!end.error} className="h-11" {...end.register} />
                <FieldError>{end.error}</FieldError>
              </Field>
            </div>

            <Alert className="flex items-center gap-2.5 rounded-xl border-0 bg-muted/60 px-3.5 py-3">
              <Badge className={cn('h-6 shrink-0 px-2.5 font-semibold', preview.className)}>{preview.label}</Badge>
              <AlertDescription className="text-[13px] leading-relaxed">{preview.text}</AlertDescription>
            </Alert>
          </div>

          <SheetFooter className="flex-row justify-end gap-2.5 border-t px-6 py-4">
            <SheetClose render={<Button type="button" variant="outline" className="h-11 rounded-full px-4.5" />}>
              Cancelar
            </SheetClose>
            <Button type="submit" disabled={loading} className="h-11 rounded-full px-5 font-semibold">
              {loading && <Spinner />}
              {loading ? 'Salvando…' : editing ? 'Salvar alterações' : 'Publicar pauta'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
