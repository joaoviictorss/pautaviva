// Percorre cadastro, voto, comentário e diálogo só com o teclado, gravando o vídeo: `npm run a11y:teclado`.
// Complementa a inspeção humana, não a substitui. Não envia voto nem comentário.
import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readdir, rename, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { chromium } from 'playwright'

const APP_URL = process.env.APP_URL ?? 'http://localhost:5173'
const API_URL = process.env.API_URL ?? 'http://localhost:3333'
const EMAIL = 'cidadao3998@carga.pautaviva.test'
const PASSWORD = 'carga1234'
const REPORTS = new URL('./teclado/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')
const SIZE = { width: 1280, height: 800 }
const MAX_TABS = 40
const PAUSE_MS = 350

const steps = []
let screen = ''

await rm(REPORTS, { recursive: true, force: true })
await mkdir(REPORTS, { recursive: true })
const profile = await mkdtemp(join(tmpdir(), 'pautaviva-teclado-'))
const context = await chromium.launchPersistentContext(profile, {
  channel: 'chrome',
  headless: true,
  viewport: SIZE,
  recordVideo: { dir: REPORTS, size: SIZE },
})
const page = context.pages()[0] ?? (await context.newPage())

// mostra no vídeo a tecla pressionada e onde está o foco
async function showKey(key) {
  await page.evaluate((label) => {
    const badge = document.getElementById('a11y-key') ?? document.body.appendChild(Object.assign(document.createElement('div'), { id: 'a11y-key' }))
    badge.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:99999;padding:8px 14px;border-radius:8px;background:#111;color:#fff;font:600 16px monospace;pointer-events:none'
    badge.textContent = label
  }, `${screen} | ${key}`)
}

const focused = () =>
  page.evaluate(() => {
    const element = document.activeElement
    const { outlineStyle, outlineWidth, boxShadow } = getComputedStyle(element)
    return {
      tag: element.tagName.toLowerCase(),
      name: (element.getAttribute('aria-label') || element.innerText || element.getAttribute('placeholder') || element.getAttribute('name') || '').trim().slice(0, 50),
      type: element.getAttribute('type') ?? element.getAttribute('role'),
      visibleIndicator: (outlineStyle !== 'none' && parseFloat(outlineWidth) > 0) || boxShadow !== 'none',
      inDialog: !!element.closest('[role=dialog]'),
    }
  })

async function press(key) {
  await page.keyboard.press(key)
  await page.waitForTimeout(PAUSE_MS)
  await showKey(key)
  const focus = await focused()
  steps.push({ screen, key, ...focus })
  return focus
}

async function tabUntil(matches, description) {
  for (let tab = 0; tab < MAX_TABS; tab++) {
    const focus = await press('Tab')
    if (matches(focus)) return focus
  }
  throw new Error(`Tab não chegou em: ${description}`)
}

async function open(name, path, ready) {
  screen = name
  await page.goto(APP_URL + path)
  await ready.waitFor()
  await page.waitForTimeout(800)
}

try {
  await open('cadastro', '/cadastro', page.locator('form'))
  await tabUntil(({ type }) => type === 'submit', 'botão de cadastro')

  await page.goto(`${APP_URL}/entrar`)
  await page.locator('input[type=email]').fill(EMAIL)
  await page.locator('input[type=password]').fill(PASSWORD)
  await page.locator('button[type=submit]').click()
  await page.waitForURL((url) => !url.pathname.startsWith('/entrar'))

  const polls = await (await context.request.get(`${API_URL}/polls?status=OPEN&missing=true&pageSize=1`)).json()
  await open('voto', `/pautas/${polls.items[0].id}`, page.getByRole('heading', { name: 'Qual sua posição?' }))
  await tabUntil(({ type }) => type === 'radio', 'opção de voto')
  await press('Space')
  assert.equal(await page.getByRole('radio', { checked: true }).count(), 1, 'Espaço não selecionou a opção de voto')
  await press('ArrowDown')
  assert.equal(await page.getByRole('radio', { checked: true }).count(), 1, 'a seta não trocou a opção de voto')
  await tabUntil(({ name }) => name === 'Confirmar voto', 'botão de confirmar voto')

  screen = 'comentario'
  await tabUntil(({ tag }) => tag === 'textarea', 'campo de comentário')
  await page.keyboard.type('Digitado só com o teclado.', { delay: 25 })
  await tabUntil(({ name }) => name === 'Enviar', 'botão de enviar comentário')

  await open('dialogo', '/pautas', page.getByRole('button', { name: /votar/i }).first())
  const trigger = await tabUntil(({ name }) => /votar/i.test(name), 'botão de votar do card')
  await press('Enter')
  await page.getByRole('dialog').waitFor()
  await page.waitForTimeout(400)
  for (let tab = 0; tab < 6; tab++) assert.equal((await press('Tab')).inDialog, true, 'o foco saiu do diálogo')
  await press('Escape')
  await page.getByRole('dialog').waitFor({ state: 'hidden' })
  assert.equal((await focused()).name, trigger.name, 'o foco não voltou ao botão que abriu o diálogo')

  const withoutIndicator = steps.filter(({ tag, visibleIndicator }) => tag !== 'body' && !visibleIndicator)
  console.log(`${steps.length} teclas pressionadas | foco sem indicador visível: ${withoutIndicator.length}`)
  for (const { screen, name, tag } of withoutIndicator) console.log(`  ${screen}: <${tag}> ${name}`)
  await writeFile(join(REPORTS, 'teclado.json'), JSON.stringify(steps, null, 2))
  if (withoutIndicator.length) process.exitCode = 1
} finally {
  const video = page.video()
  await context.close()
  if (video) await rename(await video.path(), join(REPORTS, 'navegacao-por-teclado.webm'))
  for (const file of await readdir(REPORTS)) if (file.endsWith('.webm') && file !== 'navegacao-por-teclado.webm') await rm(join(REPORTS, file))
  await rm(profile, { recursive: true, force: true }).catch(() => {})
}
