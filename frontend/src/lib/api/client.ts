import { env } from '@/env'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function api<T = void>(path: string, { json, ...init }: RequestInit & { json?: unknown } = {}): Promise<T> {
  const response = await fetch(`${env.VITE_API_URL}${path}`, {
    ...init,
    credentials: 'include',
    ...(json !== undefined && {
      headers: { 'Content-Type': 'application/json', ...init.headers },
      body: JSON.stringify(json),
    }),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new ApiError(response.status, body?.message ?? 'Não foi possível concluir a ação.')
  }

  // 201 sem corpo também é sucesso: response.json() quebraria aqui e a tela acusaria falha numa ação já gravada
  const body = await response.text()
  return (body ? JSON.parse(body) : undefined) as T
}
