import { useEffect, useState } from 'react'

import { RejectCommentDialog as Layout } from './layout'
import type { RejectCommentDialogLayoutProps, RejectCommentDialogProps, RejectCommentReason } from './data'

const OFFENSIVE = 'Ofensivo ou discurso de ódio'
const OFF_TOPIC = 'Fora do tema'

const REASONS: RejectCommentReason[] = [
  { label: OFFENSIVE, description: 'Ataques pessoais, insultos ou preconceito.' },
  { label: 'Spam ou propaganda', description: 'Links, vendas ou conteúdo repetido.' },
  { label: OFF_TOPIC, description: 'Não tem relação com a pauta.' },
  { label: 'Dados pessoais', description: 'Telefone, endereço, CPF ou e-mail exposto.' },
  { label: 'Informação falsa', description: 'Afirmação comprovadamente enganosa.' },
]

export function RejectCommentDialog({ flagged, onConfirm, ...props }: RejectCommentDialogProps) {
  const { count, removing } = props
  const suggestedReason = flagged ? OFFENSIVE : OFF_TOPIC
  const [reason, setReason] = useState(suggestedReason)

  useEffect(() => {
    if (count) setReason(suggestedReason)
  }, [count, suggestedReason])

  const verb = removing ? 'Remover' : 'Rejeitar'

  const layoutProps: RejectCommentDialogLayoutProps = {
    ...props,
    title: count > 1 ? `${verb} ${count} comentários` : `${verb} comentário`,
    actionLabel: verb,
    reasons: REASONS,
    reason,
    onReasonChange: setReason,
    onSubmit: () => onConfirm(reason),
  }

  return <Layout {...layoutProps} />
}
