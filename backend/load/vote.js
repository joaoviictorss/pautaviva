// 500 usuários virtuais votando na mesma pauta: rampa de 2 min e patamar de 5 min.
// Como rodar: seção "Teste de carga" do README.
import { check, sleep } from 'k6'
import exec from 'k6/execution'
import http from 'k6/http'

const API_URL = __ENV.API_URL ?? 'http://backend:3333'
const ORIGIN = 'http://localhost:5173'
const PASSWORD = 'carga1234'
const POLL_TITLE = 'Pauta do teste de carga'
const ACCOUNTS = 4000
const OPTIONS = ['FOR', 'AGAINST', 'ABSTAIN']

export const options = {
  scenarios: {
    votes: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 500 },
        { duration: '5m', target: 500 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
    'http_req_duration{name:login}': ['p(95)<1500'],
    'http_req_duration{name:vote}': ['p(95)<500'],
  },
}

const between = (min, max) => min + Math.random() * (max - min)

export function setup() {
  const query = `search=${encodeURIComponent(POLL_TITLE)}&status=OPEN`
  const poll = http.get(`${API_URL}/polls?${query}`).json('items.0')
  if (!poll) exec.test.abort('Pauta de carga não encontrada: rode o seed de carga.')
  if (poll.participations) exec.test.abort('A pauta já tem votos e cada conta só vota uma vez: rode o seed de carga de novo.')
  return { pollId: poll.id }
}

export default function ({ pollId }) {
  // cada iteração é um cidadão diferente, porque o segundo voto da mesma conta volta 409
  const index = exec.scenario.iterationInTest
  if (index >= ACCOUNTS) exec.test.abort(`As ${ACCOUNTS} contas do seed acabaram.`)

  // sem IP próprio por cidadão, o rate limit de 10 logins/min derruba tudo em 429; exige TRUST_PROXY no backend
  const ip = `10.${(index >> 16) & 255}.${(index >> 8) & 255}.${index & 255}`
  const headers = { Origin: ORIGIN, 'Content-Type': 'application/json', 'X-Forwarded-For': ip }

  const login = http.post(
    `${API_URL}/api/auth/sign-in/email`,
    JSON.stringify({ email: `cidadao${index + 1}@carga.pautaviva.test`, password: PASSWORD }),
    { headers, tags: { name: 'login' } },
  )
  if (!check(login, { 'login 200': (response) => response.status === 200 })) return

  sleep(between(20, 40)) // lendo a pauta

  const vote = http.post(
    `${API_URL}/polls/${pollId}/votes`,
    JSON.stringify({ option: OPTIONS[index % OPTIONS.length] }),
    { headers, tags: { name: 'vote' } },
  )
  check(vote, { 'voto 201': (response) => response.status === 201 })

  sleep(between(20, 30))
}

export function teardown({ pollId }) {
  const poll = http.get(`${API_URL}/polls/${pollId}`).json()
  const votes = poll.results.FOR + poll.results.AGAINST + poll.results.ABSTAIN
  console.log(`votos: ${votes} | participações: ${poll.participations}`)
  // voto e participação entram na mesma transação: diferença aqui é perda de integridade
  if (votes !== poll.participations) exec.test.abort('Votos e participações divergem.')
}
