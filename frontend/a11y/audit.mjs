// Auditoria WCAG 2.1 AA (RNF07) com axe-core e Lighthouse: `npm run a11y`, com o ambiente local no ar.
// Usa uma conta do seed de carga e não envia voto nem comentário.
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import AxeBuilder from '@axe-core/playwright'
import lighthouse from 'lighthouse'
import { chromium } from 'playwright'

const APP_URL = process.env.APP_URL ?? 'http://localhost:5173'
const API_URL = process.env.API_URL ?? 'http://localhost:3333'
const EMAIL = 'cidadao3999@carga.pautaviva.test'
const PASSWORD = 'carga1234'
const REPORTS = new URL('./reports/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')
const PORT = 9333
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
const VIEWPORTS = { desktop: { width: 1366, height: 900 }, mobile: { width: 375, height: 812 } }

const heading = (page, name) => page.getByRole('heading', { name }).first().waitFor()

const PUBLIC_SCREENS = [
  { name: 'cadastro', path: '/cadastro', ready: (page) => page.locator('form').waitFor() },
  {
    name: 'cadastro-erros',
    path: '/cadastro',
    ready: async (page) => {
      await page.locator('button[type=submit]').click()
      await page.locator('[aria-invalid=true]').first().waitFor()
    },
  },
  { name: 'consulta', path: '/pautas', ready: (page) => page.locator('main a[href^="/pautas/"]').first().waitFor() },
]

const pollScreens = (pollPath) => [
  { name: 'consulta-pauta', path: pollPath, ready: (page) => heading(page, 'Qual sua posição?') },
  {
    name: 'voto',
    path: pollPath,
    ready: async (page) => {
      await page.getByRole('radio').first().check()
      await page.getByRole('button', { name: 'Confirmar voto' }).waitFor()
    },
  },
  {
    name: 'comentario',
    path: pollPath,
    ready: async (page) => {
      await page.getByLabel('Escreva um comentário').fill('Comentário usado só na auditoria, sem enviar.')
    },
  },
]

const VOTE_DIALOG = {
  name: 'voto-dialogo',
  path: '/pautas',
  ready: async (page) => {
    await page.getByRole('button', { name: /votar/i }).first().click()
    await page.getByRole('dialog').waitFor()
  },
}

async function audit(context, screen, viewportName) {
  const page = await context.newPage()
  await page.setViewportSize(VIEWPORTS[viewportName])
  await page.goto(APP_URL + screen.path)
  await screen.ready(page)
  await page.waitForTimeout(1000) // as animações de entrada terminam antes de medir o contraste

  const { violations, passes, incomplete } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  await page.screenshot({ path: join(REPORTS, `${screen.name}-${viewportName}.png`), fullPage: true })
  await page.close()

  return {
    screen: screen.name,
    viewport: viewportName,
    passed: passes.length,
    toReview: incomplete.map(({ id, nodes }) => ({ id, nodes: nodes.length })),
    violations: violations.map(({ id, impact, help, nodes }) => ({
      id,
      impact,
      help,
      nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })),
    })),
  }
}

async function runLighthouse(name, url) {
  const { lhr, report } = await lighthouse(url, {
    port: PORT,
    output: 'html',
    logLevel: 'error',
    onlyCategories: ['accessibility'],
    disableStorageReset: true, // mantém a sessão da conta logada
    formFactor: 'desktop',
    screenEmulation: { disabled: true },
  })
  await writeFile(join(REPORTS, `lighthouse-${name}.html`), report)
  const failed = lhr.categories.accessibility.auditRefs
    .filter(({ weight, id }) => weight > 0 && lhr.audits[id].score === 0)
    .map(({ id }) => id)
  return { screen: name, score: Math.round(lhr.categories.accessibility.score * 100), failed }
}

await rm(REPORTS, { recursive: true, force: true })
await mkdir(REPORTS, { recursive: true })

const profile = await mkdtemp(join(tmpdir(), 'pautaviva-a11y-'))
const context = await chromium.launchPersistentContext(profile, {
  channel: 'chrome',
  headless: true,
  args: [`--remote-debugging-port=${PORT}`],
})

try {
  const axeResults = []
  const lighthouseResults = []

  for (const screen of PUBLIC_SCREENS) {
    for (const viewport of Object.keys(VIEWPORTS)) axeResults.push(await audit(context, screen, viewport))
  }
  lighthouseResults.push(await runLighthouse('cadastro', `${APP_URL}/cadastro`), await runLighthouse('consulta', `${APP_URL}/pautas`))

  const login = await context.newPage()
  await login.goto(`${APP_URL}/entrar`)
  await login.locator('input[type=email]').fill(EMAIL)
  await login.locator('input[type=password]').fill(PASSWORD)
  await login.locator('button[type=submit]').click()
  await login.waitForURL((url) => !url.pathname.startsWith('/entrar'))
  await login.close()

  const openPolls = await (await context.request.get(`${API_URL}/polls?status=OPEN&missing=true&pageSize=1`)).json()
  const pollPath = `/pautas/${openPolls.items[0].id}`

  for (const screen of [...pollScreens(pollPath), VOTE_DIALOG]) {
    for (const viewport of Object.keys(VIEWPORTS)) axeResults.push(await audit(context, screen, viewport))
  }
  lighthouseResults.push(await runLighthouse('voto-e-comentario', APP_URL + pollPath))

  await writeFile(join(REPORTS, 'resultado.json'), JSON.stringify({ axe: axeResults, lighthouse: lighthouseResults }, null, 2))

  const violations = axeResults.reduce((total, { violations }) => total + violations.length, 0)
  console.table(axeResults.map(({ screen, viewport, passed, violations, toReview }) => ({
    tela: screen,
    viewport,
    regras_ok: passed,
    violacoes: violations.map(({ id, nodes }) => `${id} (${nodes.length})`).join(', ') || '-',
    revisar: toReview.map(({ id, nodes }) => `${id} (${nodes})`).join(', ') || '-',
  })))
  console.table(lighthouseResults.map(({ screen, score, failed }) => ({ tela: screen, nota: score, falhas: failed.join(', ') || '-' })))

  if (violations > 0) process.exitCode = 1
} finally {
  await context.close()
  await rm(profile, { recursive: true, force: true }).catch(() => {})
}
