import { toast } from '@/components/ui/toast'
import { api } from '@/lib/api/client'

/** Devolve se a alteração foi salva; a falha já avisa a pessoa. */
export async function setPollReminder(pollId: string, active: boolean) {
  try {
    await api(`/polls/${encodeURIComponent(pollId)}/reminder`, { method: active ? 'PUT' : 'DELETE' })
    toast.add(
      active
        ? { type: 'success', title: 'Lembrete ativado', description: 'Avisaremos por e-mail quando a votação abrir.' }
        : { type: 'success', title: 'Lembrete desativado' },
    )
    return true
  } catch (error) {
    toast.add({ type: 'error', title: 'Não foi possível alterar o lembrete', description: (error as Error).message })
    return false
  }
}
