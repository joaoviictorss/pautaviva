// 500 usuários virtuais votando na mesma pauta (RNF09), com 500 clientes Socket.io medindo a propagação (RNF01).
// Rampa de 2 min e patamar de 5 min. Como rodar: seção "Teste de carga" do README.
import { check, sleep } from 'k6'
import exec from 'k6/execution'
import http from 'k6/http'
import { Counter, Trend } from 'k6/metrics'
import ws from 'k6/ws'

const API_URL = __ENV.API_URL ?? 'http://backend:3333'
const SOCKET_URL = `${API_URL.replace(/^http/, 'ws')}/socket.io/?EIO=4&transport=websocket`
const USERS = Number(__ENV.USERS ?? 500)
const RAMP_S = Number(__ENV.RAMP_S ?? 120)
const HOLD_S = Number(__ENV.HOLD_S ?? 300)
const DRAIN_S = 30 // os clientes ficam conectados até chegarem os últimos votos
const ORIGIN = 'http://localhost:5173'
const PASSWORD = 'carga1234'
const POLL_TITLE = 'Pauta do teste de carga'
const ACCOUNTS = 4000
const OPTIONS = ['FOR', 'AGAINST', 'ABSTAIN']

const propagation = new Trend('propagation_ms', true)
const connected = new Counter('ws_connected')
const dropped = new Counter('ws_dropped')

export const options = {
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
  scenarios: {
    votes: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: `${RAMP_S}s`, target: USERS },
        { duration: `${HOLD_S}s`, target: USERS },
      ],
    },
    listeners: {
      executor: 'ramping-vus',
      exec: 'listen',
      startVUs: 0,
      stages: [
        { duration: `${RAMP_S}s`, target: USERS },
        { duration: `${HOLD_S + DRAIN_S}s`, target: USERS },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
    'http_req_duration{name:login}': ['p(95)<1500'],
    'http_req_duration{name:vote}': ['p(95)<1000'],
    propagation_ms: ['avg<5000', 'p(95)<5000'],
    ws_dropped: ['count==0'],
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

// o k6 não tem cliente Socket.io: fala direto o protocolo do Engine.IO (0 abre, 2 é ping, 40 entra, 42 é evento)
export function listen({ pollId }) {
  const closeAt = exec.scenario.startTime + (RAMP_S + HOLD_S + DRAIN_S - 2) * 1000

  ws.connect(SOCKET_URL, { headers: { Origin: ORIGIN } }, (socket) => {
    socket.on('message', (message) => {
      if (message === '2') socket.send('3')
      else if (message.startsWith('0')) socket.send('40')
      else if (message.startsWith('40')) connected.add(1)
      else if (message.startsWith('42')) {
        const [event, payload] = JSON.parse(message.slice(2))
        if (event === 'poll-results' && payload.pollId === pollId) propagation.add(Date.now() - payload.registeredAt)
      }
    })
    let finished = false
    socket.on('close', () => {
      if (!finished) dropped.add(1)
    })
    socket.setTimeout(() => {
      finished = true
      socket.close()
    }, Math.max(0, closeAt - Date.now()))
  })

  sleep(Math.max(0, closeAt - Date.now()) / 1000 + 5)
}

export function teardown({ pollId }) {
  const poll = http.get(`${API_URL}/polls/${pollId}`).json()
  const votes = poll.results.FOR + poll.results.AGAINST + poll.results.ABSTAIN
  console.log(`votos: ${votes} | participações: ${poll.participations}`)
  // voto e participação entram na mesma transação: diferença aqui é perda de integridade
  if (votes !== poll.participations) exec.test.abort('Votos e participações divergem.')
}
