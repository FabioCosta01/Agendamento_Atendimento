# Agendamento Atendimento

Sistema web para agendamento, acompanhamento e administracao de atendimentos tecnicos da Empaer-MT, com perfis separados para solicitante, extensionista e administrador.

## Stack

- Monorepo NPM Workspaces: `backend`, `frontend`, `shared`
- Backend: NestJS 11, TypeScript, Prisma 6, MySQL/MariaDB, JWT e Helmet
- Frontend: React 19, Vite 6, TypeScript, React Router, Axios
- Shared: enums e tipos TypeScript compartilhados
- Deploy previsto: frontend estatico via Nginx e proxy reverso para `/api`

## Requisitos

- Node.js `>=22`
- npm `>=10`
- MySQL ou MariaDB, com uso local previsto via XAMPP
- Banco sugerido: `agendamento_atendimento`

## Variaveis de ambiente

Backend (`backend/.env`):

```env
NODE_ENV="development"
DATABASE_URL="mysql://root:@localhost:3306/agendamento_atendimento"
PORT=3001
FRONTEND_URL="http://localhost:5173"
JWT_SECRET="trocar-por-um-segredo-seguro"
```

Frontend (`frontend/.env`):

```env
VITE_API_URL=http://localhost:3001/api
```

Em producao, usar `NODE_ENV=production`, `JWT_SECRET` forte, `FRONTEND_URL` com o dominio oficial e, se necessario, `VITE_API_URL=/api`.

## Instalacao local

```bash
npm install
```

Crie o banco:

```sql
CREATE DATABASE IF NOT EXISTS agendamento_atendimento
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Gere o client Prisma e aplique o schema:

```bash
npm run prisma:generate
cd backend
npx prisma db push
```

Opcionalmente carregue a base inicial:

```bash
npm run seed -w backend
```

## Execucao

Backend:

```bash
npm run backend:dev
```

Frontend:

```bash
npm run frontend:dev
```

URLs padrao:

- Frontend: `http://localhost:5173`
- API: `http://localhost:3001/api`
- Health check: `GET http://localhost:3001/api/health`

## Build e validacao

```bash
npm run build
npm run lint
npm run test -w backend
```

## Deploy

1. Gerar build do frontend: `npm run build -w frontend`.
2. Gerar build do backend: `npm run build -w backend`.
3. Subir o backend com `node dist/src/main.js`.

## Produção

- Copie `backend/.env.production.example` para `backend/.env.production` e ajuste os valores reais.
- Copie `frontend/.env.production.example` para `frontend/.env.production`.
- Em produção, use `NODE_ENV=production`, `JWT_SECRET` forte e `FRONTEND_URL` apontando para o domínio real.
- O frontend deve usar `VITE_API_URL=/api` para funcionar via proxy reverso.
- O Nginx deve redirecionar HTTP para HTTPS e servir `frontend/dist` com proxy para `/api/`.
- A rota de healthcheck é `GET /api/health`.
- Execute migrations em produção com `npx prisma migrate deploy --schema backend/prisma/schema.prisma`.
- Use `scripts/deploy.ps1` para um fluxo de build + migrations + validação de healthcheck no Windows.
- Valide o backend com `curl -I https://seu-dominio/api/health` ou `Invoke-WebRequest` no Windows.

4. Servir `frontend/dist` via Nginx.
5. Fazer proxy de `/api/` para `http://127.0.0.1:3001/api/`.
6. Configurar `FRONTEND_URL`, `DATABASE_URL` e `JWT_SECRET` seguro no ambiente de producao.

O arquivo base de Nginx esta em `scripts/nginx/agendamento-atendimento.conf`.

## Visao geral da API

Todas as rotas usam prefixo `/api`. Exceto `POST /auth/login`, as rotas exigem `Authorization: Bearer <token>`.

| Metodo | Rota | Uso principal |
| --- | --- | --- |
| GET | `/health` | Verificar disponibilidade da API |
| POST | `/auth/login` | Autenticar por documento ou e-mail e senha |
| GET | `/auth/me` | Retornar usuario autenticado |
| GET | `/usuarios` | Listar usuarios, apenas administrador |
| POST | `/usuarios` | Criar usuario, apenas administrador |
| POST | `/usuarios/cadastrar-solicitante` | Cadastro inicial do solicitante |
| GET | `/servicos` | Listar servicos |
| POST | `/servicos` | Criar servico, apenas administrador |
| GET | `/propriedades` | Listar propriedades conforme perfil |
| POST | `/propriedades` | Criar propriedade |
| GET | `/pontos-atendimento` | Listar municipios, apenas administrador |
| GET | `/disponibilidade-agenda` | Listar disponibilidade conforme perfil |
| POST | `/disponibilidade-agenda` | Criar disponibilidade, extensionista ou administrador |
| POST | `/disponibilidade-agenda/semanal` | Criar disponibilidade semanal |
| GET | `/agendamentos` | Listar agendamentos conforme perfil |
| POST | `/agendamentos` | Criar agendamento |
| PATCH | `/agendamentos/:protocolCode/status` | Alterar status, extensionista ou administrador |
| PATCH | `/agendamentos/:protocolCode/reagendar` | Reagendar, extensionista ou administrador |

## Documentacao completa

A auditoria tecnica completa esta em `docs/auditoria-completa.md`.
