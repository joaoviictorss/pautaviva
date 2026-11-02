// Mede a triagem real (RNF14) com as 200 frases rotuladas: `npm run eval:triagem`.
// SUSPECT e INAPPROPRIATE contam como detectados, porque o comentário não é publicado. Sem resposta da IA, não conta.
import { mkdir, writeFile } from 'node:fs/promises'

import { screenComment } from '../src/lib/comment-moderation.js'
import { NORMAL_COMMENTS, OFFENSIVE_COMMENTS } from '../prisma/demo-comments.js'

const REPORTS = new URL('../load/reports/triagem/', import.meta.url)
const PAUSE_MS = Number(process.env.SCREENING_PAUSE_MS ?? 4500)
const RETRIES = 5
const RETRY_PAUSE_MS = 30_000

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function screen(text: string) {
  for (let attempt = 0; ; attempt++) {
    let failure = ''
    const result = await screenComment(text, { error: (error: unknown) => { failure = String(error) } })
    if (result.classification || attempt === RETRIES) return { ...result, failure }
    console.log(`  sem resposta da IA, nova tentativa ${attempt + 1}: ${failure.slice(0, 120)}`)
    await wait(RETRY_PAUSE_MS)
  }
}

const samples = [
  ...OFFENSIVE_COMMENTS.map((text) => ({ text, offensive: true })),
  ...NORMAL_COMMENTS.map((text) => ({ text, offensive: false })),
]
const results = []
await mkdir(REPORTS, { recursive: true })

for (const [index, sample] of samples.entries()) {
  const started = Date.now()
  const { classification, reason, autoRejected, failure } = await screen(sample.text)
  results.push({ ...sample, classification, autoRejected, reason, failure, ms: Date.now() - started })
  console.log(`${index + 1}/${samples.length} ${classification ?? 'SEM_RESPOSTA'}${autoRejected ? ' (lista)' : ''}`)
  await writeFile(new URL('resultado.json', REPORTS), JSON.stringify(results, null, 2))
  if (!autoRejected) await wait(PAUSE_MS)
}

const detected = (result: (typeof results)[number]) => result.classification === 'SUSPECT' || result.classification === 'INAPPROPRIATE'
const offensive = results.filter((result) => result.offensive)
const normal = results.filter((result) => !result.offensive)
const truePositives = offensive.filter(detected).length
const falsePositives = normal.filter(detected).length
const summary = {
  verdadeirosPositivos: truePositives,
  falsosNegativos: offensive.length - truePositives,
  falsosPositivos: falsePositives,
  verdadeirosNegativos: normal.length - falsePositives,
  revocacao: truePositives / offensive.length,
  taxaFalsosPositivos: falsePositives / normal.length,
  precisao: truePositives / (truePositives + falsePositives),
  detectadosPelaLista: results.filter((result) => result.autoRejected).length,
  semRespostaDaIa: results.filter((result) => !result.classification).length,
}

await writeFile(new URL('resumo.json', REPORTS), JSON.stringify(summary, null, 2))
console.log(summary)
process.exitCode = summary.revocacao >= 0.9 && summary.taxaFalsosPositivos <= 0.1 ? 0 : 1
