import { getAvatarUrl } from '@/lib/utils/avatar'
import { getInitials } from '@/lib/utils/format'

const PALETTE: Array<[bg: string, fg: string]> = [
  ['oklch(0.9656 0.0176 39.4009)', 'oklch(0.5581 0.1911 35.3377)'],
  ['oklch(0.93 0.04 259.7)', 'oklch(0.45 0.16 259.7)'],
  ['oklch(0.95 0.06 84.7)', 'oklch(0.45 0.09 70)'],
  ['oklch(0.954 0.0063 255.4755)', 'oklch(0.1344 0 0)'],
  ['oklch(0.92 0.06 50)', 'oklch(0.5 0.15 45)'],
]

export const PEOPLE = [
  'Marina Souza',
  'Carlos Mendes',
  'Ana Beatriz',
  'João Pedro',
  'Lúcia Ramos',
  'Rafael Lima',
  'Denise Alves',
  'Thiago Rocha',
  'Fernanda Costa',
  'Paulo Henrique',
  'Beatriz Nunes',
  'Gustavo Reis',
]

const AVATAR_COUNT = 20

export interface AvatarData {
  name: string
  initials: string
  bg: string
  fg: string
  src: string
}

/** Determinístico: mesmo nome + índice sempre gera o mesmo avatar. */
export function getAvatar(name: string, index: number): AvatarData {
  const [bg, fg] = PALETTE[index % PALETTE.length]
  const personIndex = PEOPLE.indexOf(name)
  const id = ((personIndex >= 0 ? personIndex : index + 7) % AVATAR_COUNT) + 1
  return {
    name,
    initials: getInitials(name),
    bg,
    fg,
    src: getAvatarUrl(id),
  }
}
