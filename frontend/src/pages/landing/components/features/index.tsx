import { useEffect, useState } from 'react'
import { CheckIcon, ClockIcon, LaptopIcon, MonitorIcon, ScanSearchIcon, ShieldXIcon, SmartphoneIcon } from 'lucide-react'

import { getAvatar } from '@/lib/mocks/people'
import { seededRandom } from '@/lib/mocks/random'
import { formatNumber } from '@/lib/utils/format'
import { getBars, getPercent, getTotal } from '@/lib/poll/votes'

import { Features as Layout } from './layout'
import type {
  FeaturesLayoutProps,
  FeaturesProps,
  FlowStep,
  ModerationItem,
  StackPanelStyle,
  SyncClient,
} from './data'

const FLOW_LABELS = [
  'Gestor cadastra a pauta',
  'Comunidade vota',
  'Resultado ao vivo',
  'Encerra e exporta',
]
const STEP_MS = 3600

const STACK: Omit<StackPanelStyle, 'pointerEvents'>[] = [
  { opacity: 1, transform: 'translateY(0) scale(1)', zIndex: 4 },
  { opacity: 1, transform: 'translateY(-15px) scale(.94)', zIndex: 3 },
  { opacity: 0.7, transform: 'translateY(-29px) scale(.88)', zIndex: 2 },
  { opacity: 0, transform: 'translateY(-40px) scale(.82)', zIndex: 1 },
]

function panelStyleFor(panelIndex: number, activeStep: number): StackPanelStyle {
  const distance = (panelIndex - activeStep + FLOW_LABELS.length) % FLOW_LABELS.length
  return { ...STACK[distance], pointerEvents: distance === 0 ? 'auto' : 'none' }
}

const COMMENTS: Array<[name: string, text: string, flagged: boolean]> = [
  ['Carlos Mendes', 'Apoio! Vou de bike até o metrô todo dia e hoje é arriscado.', false],
  ['Lúcia Ramos', 'Precisa pensar na carga e descarga dos comércios da avenida.', false],
  ['Usuário 4821', 'xxxx xxxxxx xxx xxxxxxxx xxxx xxxxx', true],
  ['Ana Beatriz', 'Dá pra incluir iluminação no trecho perto da praça?', false],
  ['Rafael Lima', 'Sou contra, a avenida já é estreita nos horários de pico.', false],
  ['Usuário 1190', 'GANHE SEGUIDORES AGORA → link.xyz/promo', true],
]

const SYNC_CLIENTS: Array<[icon: SyncClient['icon'], name: string]> = [
  [SmartphoneIcon, 'Celular da Marina'],
  [MonitorIcon, 'Telão da associação'],
  [LaptopIcon, 'Notebook do gestor'],
]

export function Features({ poll }: FeaturesProps) {
  const [step, setStep] = useState(0)
  const [cycleKey, setCycleKey] = useState(0)
  const [moderationTick, setModerationTick] = useState(3)

  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % FLOW_LABELS.length), STEP_MS)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycleKey])

  useEffect(() => {
    const id = setInterval(() => setModerationTick((t) => t + 1), 2200)
    return () => clearInterval(id)
  }, [])

  const selectStep = (k: number) => {
    setStep(k)
    setCycleKey((c) => c + 1)
  }

  const flowSteps: FlowStep[] = FLOW_LABELS.map((label, k) => ({
    n: '0' + (k + 1),
    label,
    active: k === step,
    progressPercent: k < step ? 100 : 0,
    animating: k === step,
    animateKey: cycleKey,
    onSelect: () => selectStep(k),
  }))

  const panelStyles = [0, 1, 2, 3].map((k) => panelStyleFor(k, step))

  const total = getTotal(poll.votes)
  const bars = getBars(poll.votes)
  const favPct = Math.round(getPercent(poll.votes, 'f'))

  const moderationFeed: ModerationItem[] = [0, 1, 2, 3]
    .filter((j) => moderationTick - j >= 0)
    .map((j) => {
      const k = moderationTick - j
      const [name, text, flagged] = COMMENTS[k % COMMENTS.length]
      const avatar = getAvatar(name, k)

      let status: string
      let statusIcon: ModerationItem['statusIcon']
      let statusBg: string
      let statusFg: string
      if (j === 0) {
        status = 'Triagem automática'
        statusIcon = ScanSearchIcon
        statusBg = 'var(--muted)'
        statusFg = 'var(--muted-foreground)'
      } else if (flagged) {
        status = 'Bloqueado'
        statusIcon = ShieldXIcon
        statusBg = 'oklch(0.629 0.1902 23.07 / .1)'
        statusFg = 'oklch(0.55 0.19 23)'
      } else if (j === 1) {
        status = 'Em análise'
        statusIcon = ClockIcon
        statusBg = 'oklch(0.95 0.06 84.7)'
        statusFg = 'oklch(0.45 0.09 70)'
      } else {
        status = 'Publicado'
        statusIcon = CheckIcon
        statusBg = 'oklch(0.95 0.04 150)'
        statusFg = 'oklch(0.42 0.12 150)'
      }

      return {
        ...avatar,
        key: `${k}-${j}`,
        text,
        status,
        statusIcon,
        statusBg,
        statusFg,
        blurred: flagged && j > 0,
        highlighted: j === 0,
      }
    })

  const publishedTotal = 214 + Math.floor(moderationTick * 0.6)

  const syncClients: SyncClient[] = SYNC_CLIENTS.map(([icon, name], k) => ({
    icon,
    name,
    latencyLabel:
      (0.12 + seededRandom(poll.pulse * 3 + k) * 0.9).toFixed(2).replace('.', ',') + 's',
    flashKey: poll.pulse * 10 + k,
  }))

  const layoutProps: FeaturesLayoutProps = {
    poll,
    flowSteps,
    panelStyles,
    favPctLabel: `${favPct}%`,
    totalLabel: formatNumber(total),
    bars,
    moderationFeed,
    publishedLabel: formatNumber(publishedTotal),
    syncClients,
  }

  return <Layout {...layoutProps} />
}
