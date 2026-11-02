// 100 votos disparados ao mesmo tempo pela mesma conta, na mesma pauta (RNF02): só um pode entrar.
// Como rodar: seção "Teste de carga" do README. ACCOUNT escolhe a conta do seed, uma por execução.
import { sleep } from 'k6'
import exec from 'k6/execution'
import http from 'k6/http'
import { Counter } from 'k6/metrics'

const API_URL = __ENV.API_URL ?? 'http://backend:3333'
const ORIGIN = 'http://localhost:5173'
const PASSWORD = 'carga1234'
const POLL_TITLE = 'Pauta do teste de carga'
const ACCOUNT = __ENV.ACCOUNT ?? '1'
const REQUESTS = 100
const START_DELAY_MS = 3000

const accepted = new Counter('votes_accepted')
const duplicated = new Counter('votes_duplicated')
const unexpected = new Counter('votes_unexpected')

export const options = {
  scenarios: {
    duplicates: { executor: 'per-vu-iterations', vus: REQUESTS, iterations: 1, maxDuration: '1m' },
  },
  thresholds: {
    votes_accepted: ['count==1'],
    votes_duplicated: [`count==${REQUESTS - 1}`],
    votes_unexpected: ['count==0'],
  },
}

const readPoll = (id, headers) => http.get(`${API_URL}/polls/${id}`, { headers }).json()
const countVotes = ({ FOR, AGAINST, ABSTAIN }) => FOR + AGAINST + ABSTAIN

export function setup() {
  const login = http.post(
    `${API_URL}/api/auth/sign-in/email`,
    JSON.stringify({ email: `cidadao${ACCOUNT}@carga.pautaviva.test`, password: PASSWORD }),
    { headers: { Origin: ORIGIN, 'Content-Type': 'application/json' } },
  )
  if (login.status !== 200) exec.test.abort(`Login recusado (${login.status}): rode o seed de carga.`)

  // o k6 não divide cookies entre VUs: todos enviam a mesma sessão, como abas abertas da mesma conta
  const cookie = Object.entries(login.cookies).map(([name, [{ value }]]) => `${name}=${value}`).join('; ')
  const query = `search=${encodeURIComponent(POLL_TITLE)}&status=OPEN`
  const pollId = http.get(`${API_URL}/polls?${query}`).json('items.0.id')
  if (!pollId) exec.test.abort('Pauta de carga não encontrada: rode o seed de carga.')

  const poll = readPoll(pollId, { Cookie: cookie })
  if (poll.hasVoted) exec.test.abort(`A conta ${ACCOUNT} já votou: use outro ACCOUNT ou rode o seed de carga.`)

  return {
    cookie,
    pollId,
    votesBefore: countVotes(poll.results),
    participationsBefore: poll.participations,
    startAt: Date.now() + START_DELAY_MS,
  }
}

export default function ({ cookie, pollId, startAt }) {
  // os VUs esperam o mesmo instante; http.batch limitaria a 6 conexões por host
  sleep(Math.max(0, startAt - Date.now()) / 1000)

  const { status } = http.post(`${API_URL}/polls/${pollId}/votes`, JSON.stringify({ option: 'FOR' }), {
    headers: { Origin: ORIGIN, 'Content-Type': 'application/json', Cookie: cookie },
  })
  accepted.add(status === 201 ? 1 : 0)
  duplicated.add(status === 409 ? 1 : 0)
  unexpected.add(status === 201 || status === 409 ? 0 : 1)
}

export function teardown({ pollId, votesBefore, participationsBefore }) {
  const poll = readPoll(pollId, {})
  const newVotes = countVotes(poll.results) - votesBefore
  const newParticipations = poll.participations - participationsBefore
  console.log(`conta ${ACCOUNT} | votos novos: ${newVotes} | participações novas: ${newParticipations}`)
  if (newVotes !== 1 || newParticipations !== 1) exec.test.abort('A pauta não recebeu exatamente um voto.')
}
