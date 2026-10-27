import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { toast } from '@/components/ui/toast'
import { api } from '@/lib/api/client'
import { formField } from '@/lib/form/field'
import { getCategoryLook } from '@/lib/poll/categories'
import { POLL_STATUS, type PollStatus } from '@/lib/poll/status'

import { PollDrawer as Layout } from './layout'
import type { PollDrawerLayoutProps, PollDrawerProps } from './data'

const toInputDate = (date: Date) => format(date, 'yyyy-MM-dd')
const today = () => toInputDate(new Date())
const shortDate = (input: string) => format(new Date(`${input}T00:00`), 'dd MMM', { locale: ptBR }).replace('.', '')

const pollSchema = z
  .object({
    title: z.string().trim().min(5, 'Informe o título da pauta.').max(90, 'Use no máximo 90 caracteres.'),
    description: z.string().trim().min(10, 'Descreva a proposta.'),
    categoryId: z.string().min(1, 'Escolha uma categoria.'),
    start: z.string().min(1, 'Informe a data de início.'),
    end: z.string().min(1, 'Informe a data de término.'),
  })
  .refine((v) => v.start >= today(), { path: ['start'], message: 'A data de início não pode estar no passado.' })
  .refine((v) => !v.start || v.end > v.start, {
    path: ['end'],
    message: 'A data de término deve ser posterior à data de início.',
  })

type PollValues = z.infer<typeof pollSchema>

const EMPTY: PollValues = { title: '', description: '', categoryId: '', start: '', end: '' }

export function PollDrawer(props: PollDrawerProps) {
  const { open, poll, categories, onSaved } = props
  const editing = !!poll

  const form = useForm<PollValues>({ resolver: zodResolver(pollSchema), defaultValues: EMPTY })

  useEffect(() => {
    if (!open) return
    form.reset(
      poll
        ? {
            title: poll.title,
            description: poll.description,
            categoryId: poll.category.id,
            start: toInputDate(new Date(poll.startsAt)),
            end: toInputDate(new Date(poll.endsAt)),
          }
        : { ...EMPTY, start: today(), end: toInputDate(new Date(Date.now() + 14 * 864e5)) }
    )
  }, [open, poll, form])

  const onSubmit = form.handleSubmit(async ({ title, start, end, ...values }) => {
    // Datas do formulário são dias locais: a votação vai do início do primeiro dia ao fim do último.
    const body = {
      ...values,
      startsAt: new Date(`${start}T00:00`).toISOString(),
      endsAt: new Date(`${end}T23:59:59.999`).toISOString(),
    }

    try {
      if (poll) {
        await api(`/polls/${poll.id}`, { method: 'PATCH', json: body })
        toast.add({ type: 'success', title: 'Pauta atualizada', description: title })
      } else {
        const created = await api<{ status: PollStatus }>('/polls', { method: 'POST', json: { ...body, title } })
        toast.add(
          created.status === 'OPEN'
            ? { type: 'success', title: 'Pauta publicada', description: 'A votação já está aberta para a comunidade.' }
            : { type: 'success', title: 'Pauta agendada', description: `A votação abre em ${shortDate(start)}.` }
        )
      }
      onSaved()
    } catch (err) {
      toast.add({ type: 'error', title: 'Não foi possível salvar a pauta', description: (err as Error).message })
    }
  })

  const start = form.watch('start')
  const categoryId = form.watch('categoryId')
  const previewStatus: PollStatus = start && start <= today() ? 'OPEN' : 'SCHEDULED'

  const layoutProps: PollDrawerLayoutProps = {
    ...props,
    editing,
    title: formField(form, 'title'),
    description: formField(form, 'description'),
    start: formField(form, 'start'),
    end: formField(form, 'end'),
    categoryOptions: categories.map((category) => ({
      id: category.id,
      name: category.name,
      look: getCategoryLook(category.name),
      selected: category.id === categoryId,
    })),
    categoryId,
    onCategoryChange: (id) => form.setValue('categoryId', id, { shouldValidate: form.formState.isSubmitted }),
    categoryError: form.formState.errors.categoryId?.message,
    preview: {
      ...POLL_STATUS[previewStatus],
      text:
        previewStatus === 'OPEN'
          ? 'Início hoje: a votação abre assim que você publicar.'
          : `Início futuro: a pauta fica agendada${start ? ` até ${shortDate(start)}` : ''} e ainda pode ser editada.`,
    },
    loading: form.formState.isSubmitting,
    onSubmit,
  }

  return <Layout {...layoutProps} />
}
