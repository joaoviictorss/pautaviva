import { formatNumber } from '@/lib/utils/format'
import {
  BusIcon,
  Building2Icon,
  ChartColumnIcon,
  GraduationCapIcon,
  HardHatIcon,
  HeartIcon,
  LeafIcon,
  PaletteIcon,
  ShieldIcon,
  TagIcon,
  type LucideIcon,
} from 'lucide-react'
import type { CSSProperties } from 'react'

const CATEGORY_LOOKS: Record<string, [LucideIcon, number]> = {
  'Meio Ambiente': [LeafIcon, 150],
  Mobilidade: [BusIcon, 255],
  Educação: [GraduationCapIcon, 85],
  Saúde: [HeartIcon, 25],
  Segurança: [ShieldIcon, 290],
  Infraestrutura: [HardHatIcon, 195],
  Economia: [ChartColumnIcon, 310],
  Cultura: [PaletteIcon, 0],
  Urbanismo: [Building2Icon, 235],
}

export interface CategoryLook {
  icon: LucideIcon
  style: CSSProperties
}

export function getCategoryLook(name: string): CategoryLook {
  const [icon, hue] = CATEGORY_LOOKS[name] ?? [TagIcon, 35.9]
  return { icon, style: { backgroundColor: `oklch(0.955 0.04 ${hue})`, color: `oklch(0.45 0.13 ${hue})` } }
}

/** Chip de filtro selecionado: fundo e texto da categoria, com a borda na cor do texto. */
export function getCategoryChipStyle(name: string): CSSProperties {
  const { style } = getCategoryLook(name)
  return { ...style, borderColor: style.color }
}

export interface CategoryBar {
  name: string
  value: string
  percent: number
  icon: CategoryLook['icon']
  color: string
}

export function toCategoryBars(categories: { name: string; count: number }[]): CategoryBar[] {
  const largest = Math.max(1, ...categories.map(({ count }) => count))
  return categories.map(({ name, count }) => {
    const look = getCategoryLook(name)
    return { name, value: formatNumber(count), percent: (count / largest) * 100, icon: look.icon, color: String(look.style.color) }
  })
}
