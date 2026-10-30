const HOUR_MS = 60 * 60 * 1000

export function formatNumber(value: number) {
  return value.toLocaleString('pt-BR')
}

export function formatPercent(value: number) {
  return value.toFixed(1).replace('.', ',') + '%'
}

/** Iniciais do primeiro e do último nome: "Marina Souza" → "MS". */
export function getInitials(name: string) {
  const words = name.trim().split(/\s+/)
  const first = words[0]?.[0] ?? ''
  const last = words.length > 1 ? words[words.length - 1][0] : ''
  return (first + last).toUpperCase()
}

export function formatAge(iso: string) {
  const hours = Math.floor((Date.now() - new Date(iso).getTime()) / HOUR_MS)
  if (hours < 1) return 'agora'
  return hours >= 24 ? `há ${Math.floor(hours / 24)} d` : `há ${hours} h`
}

export const isOlderThanDay = (iso: string) => Date.now() - new Date(iso).getTime() >= 24 * HOUR_MS
