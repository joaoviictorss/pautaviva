const AVATAR_COUNT = 20

export const getAvatarUrl = (id: number) => `https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-${id}.png`

/** Imagens padrão, distintas entre si: a mesma semente sempre gera as mesmas. */
export function getDefaultAvatars(seed: string, count: number) {
  let hash = 0
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return Array.from({ length: count }, (_, index) => getAvatarUrl(((hash + index) % AVATAR_COUNT) + 1))
}

export const getDefaultAvatar = (seed: string) => getDefaultAvatars(seed, 1)[0]
