import { useState } from 'react'
import {
  AlertCircleIcon,
  ChevronDownIcon,
  ListChecksIcon,
  SearchIcon,
  XIcon,
} from 'lucide-react'

import { CommunityNavigation } from '@/components/community-navigation'
import { PollCard } from '@/components/poll-card'
import { SiteHeader } from '@/components/site-header'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandItem, CommandList } from '@/components/ui/command'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'

import type { PautasLayoutProps, PollSort, PollStatusFilter } from '../data'

const GRID = 'grid grid-cols-[repeat(auto-fill,minmax(min(100%,310px),1fr))] gap-4'

interface FilterSelectProps {
  label: string
  searchTerm?: string
  options: { value: string; label: string }[]
  value: string
  onValueChange: (value: string) => void
}

function FilterSelect({ label, searchTerm, options, value, onValueChange }: FilterSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const selectedOption = options.find((option) => option.value === value) ?? options[0]
  const searchLabel = searchTerm ?? label.toLocaleLowerCase('pt-BR').replace('filtrar por ', '')
  const filteredOptions = options.filter((option) =>
    option.label.toLocaleLowerCase('pt-BR').includes(query.trim().toLocaleLowerCase('pt-BR')),
  )

  const selectValue = (nextValue: string) => {
    onValueChange(nextValue)
    setOpen(false)
    setQuery('')
  }

  return (
    <Popover
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) setQuery('')
      }}
    >
      <div className="relative">
        <PopoverTrigger
          nativeButton={false}
          render={
            <div className="inline-flex h-10 w-full items-center justify-between gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-normal whitespace-nowrap outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:border-input dark:bg-input/30 dark:hover:bg-input/50" />
          }
          aria-label={label}
          aria-expanded={open}
        >
          {open ? (
            <>
              <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                aria-label={`Buscar ${searchLabel}`}
                className={`h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground ${selectedOption.value !== options[0].value ? 'pr-6' : ''}`}
                placeholder={`Buscar ${searchLabel}...`}
                value={query}
                onClick={(event) => event.stopPropagation()}
                onChange={(event) => setQuery(event.target.value)}
              />
            </>
          ) : (
            <>
              <span className="truncate">{selectedOption.label}</span>
              {selectedOption.value === options[0].value && (
                <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
              )}
            </>
          )}
        </PopoverTrigger>
        {selectedOption.value !== options[0].value && (
          <button
            type="button"
            aria-label={`Limpar ${searchLabel}`}
            className="absolute top-1/2 right-2 z-20 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onPointerDown={(event) => {
              event.preventDefault()
              event.stopPropagation()
            }}
            onClick={(event) => {
              event.stopPropagation()
              selectValue(options[0].value)
            }}
          >
            <XIcon className="size-4" />
          </button>
        )}
      </div>
      <PopoverContent align="start" className="w-(--anchor-width) p-0">
        <Command shouldFilter={false}>
          <CommandList>
            {filteredOptions.length === 0 && <CommandEmpty>Nenhuma opção encontrada.</CommandEmpty>}
            {filteredOptions.map((option) => (
              <CommandItem
                key={option.value}
                value={option.label}
                className="cursor-pointer"
                onSelect={() => selectValue(option.value)}
              >
                {option.label}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function Pautas({
  categories,
  polls,
  categoryId,
  status,
  sort,
  page,
  pageSize,
  total,
  search,
  loading,
  error,
  onCategoryChange,
  onStatusChange,
  onSortChange,
  onPageChange,
  onSearchChange,
  onClearFilters,
}: PautasLayoutProps) {
  const statusOptions: { value: PollStatusFilter; label: string }[] = [
    { value: 'ALL', label: 'Todas as situações' },
    { value: 'SCHEDULED', label: 'Agendadas' },
    { value: 'OPEN', label: 'Abertas' },
    { value: 'CLOSED', label: 'Encerradas' },
  ]
  const sortOptions: { value: PollSort; label: string }[] = [
    { value: 'recent', label: 'Mais recentes' },
    { value: 'start', label: 'Início mais próximo' },
    { value: 'ending', label: 'Encerramento próximo' },
  ]
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const firstItem = total === 0 ? 0 : (page - 1) * pageSize + 1
  const lastItem = Math.min(page * pageSize, total)
  const hasActiveFilters = Boolean(search.trim() || categoryId || status !== 'ALL')

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />

      <CommunityNavigation active="pautas">
        <div className="flex flex-col gap-2">
          <h1 className="m-0 text-[clamp(28px,3.2vw,38px)] font-extrabold tracking-tighter">Pautas</h1>
          <p className="m-0 text-[15px] text-muted-foreground">
            Consulte propostas locais, acompanhe os períodos de votação e veja os resultados parciais.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-[minmax(0,1fr)_repeat(3,220px)]">
          <div className="relative sm:col-span-3 lg:col-span-1">
            <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Buscar pautas"
              placeholder="Buscar por pauta ou categoria"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              className="h-10 pl-9"
            />
          </div>
          <FilterSelect
            label="Filtrar por categoria"
            options={[{ value: 'ALL', label: 'Todas as categorias' }, ...categories.map(({ id, name }) => ({ value: id, label: name }))]}
            value={categoryId || 'ALL'}
            onValueChange={(value) => onCategoryChange(value === 'ALL' ? '' : value)}
          />
          <FilterSelect
            label="Filtrar por situação"
            options={statusOptions}
            value={status}
            onValueChange={(value) => value && onStatusChange(value as PollStatusFilter)}
          />
          <FilterSelect
            label="Ordenar pautas"
            searchTerm="ordenação"
            options={sortOptions}
            value={sort}
            onValueChange={(value) => value && onSortChange(value as PollSort)}
          />
        </div>
        {hasActiveFilters && (
          <div className="-mt-4 flex justify-end">
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              <XIcon />
              Limpar todos os filtros
            </Button>
          </div>
        )}

        {error ? (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : loading ? (
          <div className={GRID}>
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-60 rounded-2xl" />
            ))}
          </div>
        ) : polls.length ? (
          <div className="flex flex-col gap-5">
            <div className={GRID}>
              {polls.map((poll) => (
                <PollCard key={poll.id} poll={poll} showDetails />
              ))}
            </div>
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="m-0 text-sm text-muted-foreground">
                Exibindo {firstItem}–{lastItem} de {total} {total === 1 ? 'pauta' : 'pautas'}
              </p>
              {totalPages > 1 && (
                <nav aria-label="Paginação das pautas" className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {page} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                  >
                    Próxima
                  </Button>
                </nav>
              )}
            </div>
          </div>
        ) : (
          <Empty className="rounded-2xl border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ListChecksIcon />
              </EmptyMedia>
              <EmptyTitle>Nenhuma pauta encontrada</EmptyTitle>
              <EmptyDescription>Experimente alterar os filtros ou a busca.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CommunityNavigation>
    </div>
  )
}
