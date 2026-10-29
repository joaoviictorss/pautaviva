import { createHmac } from 'node:crypto'

/** Mantém só os dígitos do CPF ("529.982.247-25" → "52998224725"). */
export function normalizeCpf(cpf: string) {
  return cpf.replace(/\D/g, '')
}

export function hashCpf(cpf: string, secret: string) {
  return createHmac('sha256', secret).update(normalizeCpf(cpf)).digest('hex')
}

/**
 * Validação simples de CPF (11 dígitos, rejeita sequências repetidas e
 * confere os dois dígitos verificadores). Não usa lib externa de propósito.
 */
export function isValidCpf(cpf: string) {
  const digits = normalizeCpf(cpf)
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false

  const calcCheckDigit = (length: number) => {
    let sum = 0
    for (let i = 0; i < length; i++) {
      sum += Number(digits[i]) * (length + 1 - i)
    }
    const rest = (sum * 10) % 11
    return rest === 10 ? 0 : rest
  }

  return (
    calcCheckDigit(9) === Number(digits[9]) && calcCheckDigit(10) === Number(digits[10])
  )
}
