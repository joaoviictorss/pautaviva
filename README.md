# PautaViva

Plataforma de participação cidadã — proposição, discussão, moderação e
votação de pautas locais em tempo real. (TCC)

## Stack

- **Frontend**: Vite + React + TypeScript + Tailwind CSS
- **Backend**: Fastify + TypeScript
- **Banco**: PostgreSQL + Prisma
- **Tempo real**: Socket.io (rooms por `pautaId`)
- **Auth**: JWT (`@fastify/jwt`)
- **Infra local**: Docker Compose

## Rodando com Docker (recomendado)

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3333
- Postgres: localhost:5432

Na primeira vez (e sempre que o schema do Prisma mudar), rode a migration
dentro do container do backend:

```bash
docker compose exec backend npx prisma migrate dev --name init
```

## Rodando sem Docker

### Backend

```bash
cd backend
cp .env.example .env # ajuste DATABASE_URL para seu Postgres local
npm install
npx prisma migrate dev --name init
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Contas de demonstração

Depois de rodar as migrations, popule o banco local com os dados de
demonstração:

```bash
docker compose exec backend npm run db:seed:demo
```

Todas as contas usam a senha `demo1234`:

| Cargo | E-mail |
|---|---|
| Administrador | `admin@demo.pautaviva.test` |
| Gestor | `gestor@demo.pautaviva.test` |
| Moderador | `moderador@demo.pautaviva.test` |
| Cidadão | `cidadao1@demo.pautaviva.test` |


## Teste de carga (RNF09)

`backend/load/vote.js` simula 500 usuários simultâneos (rampa de 2 min e
patamar de 5 min) autenticando e votando na mesma pauta, só no ambiente
local. O override liga `TRUST_PROXY` e `NODE_ENV=production` no backend.

```bash
docker compose -f docker-compose.yml -f docker-compose.load.yml up -d backend
docker compose -f docker-compose.yml -f docker-compose.load.yml exec backend npm run db:seed:load
docker compose -f docker-compose.yml -f docker-compose.load.yml run --rm --service-ports k6
docker compose up -d backend
```

Rode o seed antes de cada execução: ele zera a pauta, porque cada conta só
vota uma vez. A última linha volta o backend ao modo de desenvolvimento.

Durante o teste, o painel ao vivo fica em http://localhost:5665. Ao final,
`backend/load/reports/` guarda `relatorio.html` (gráficos) e `resumo.json`
(números).

`backend/load/duplicate-vote.js` dispara 100 votos simultâneos da mesma conta
na mesma pauta (RNF02) e só passa com 1 voto aceito e 99 recusados. Com o
backend e o seed de carga prontos, use um `ACCOUNT` diferente a cada execução:

```bash
docker compose -f docker-compose.yml -f docker-compose.load.yml run --rm --no-deps -e K6_WEB_DASHBOARD=false -e ACCOUNT=1 k6 run /load/duplicate-vote.js
```

## Estado atual do setup

Este é o esqueleto técnico inicial do projeto — infraestrutura e stack
funcionando de ponta a ponta, ainda sem as regras de negócio do domínio:

- Backend com error handler central (Zod, `BadRequestError`,
  `UnauthorizedError`), middleware de auth JWT (`getCurrentUserId`) e as
  rotas `POST /users` (cadastro) e `POST /sessions/password` (login).
- Único model no Prisma é `User`, o suficiente para autenticação. A
  modelagem de pauta, comentário e voto entra na próxima etapa, junto das
  rotas de negócio.
- Socket.io já configurado no mesmo servidor HTTP do Fastify, com rooms por
  `pautaId` (`join-pauta` / `leave-pauta`) prontas para os eventos de
  discussão e votação em tempo real.
- Frontend com Tailwind CSS configurado, sem UI além de um placeholder.

### Nota sobre hot-reload no Docker (Windows)

Bind mounts do Docker Desktop no Windows não propagam eventos de inotify
para dentro do container, então tanto o backend quanto o frontend usam
watch por **polling**: o backend roda `tsx` por trás do `nodemon
--legacy-watch`, e o Vite tem `server.watch.usePolling: true`. Isso faz o
hot-reload funcionar de forma confiável em qualquer host, ao custo de levar
alguns segundos a mais para detectar a mudança (o polling não é instantâneo
como inotify).
