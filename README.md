# Agendamento Atendimento

Sistema web para agendamento, acompanhamento e administracao de atendimentos tecnicos da Empaer-MT, com perfis separados para solicitante, extensionista e administrador.

## Stackk

- Monorepo NPM Workspaces: `backend`, `frontend`, `shared`
- Backend: NestJS 11, TypeScript, Prisma 6, MySQL/MariaDB, JWT e Helmet
- Frontend: React 19, Vite 6, TypeScript, React Router, Axios
- Shared: enums e tipos TypeScript compartilhados
- Deploy previsto: frontend estatico via Nginx e proxy reverso para `/api`

### Pacote `shared` e pasta `shared/dist`

- O codigo-fonte fica em `shared/src`. O build gera `shared/dist` (JavaScript + `.d.ts`).
- O `.gitignore` da raiz ignora qualquer pasta `dist/`, entao **`shared/dist` nao e versionado**. Em cada maquina ou no servidor de producao e preciso gerar esse artefato.
- Apos `npm install` na **raiz** do monorepo, o script **`prepare`** executa `npm run build -w shared` automaticamente (nao use `npm install --ignore-scripts` em CI/deploy sem rodar o build do shared em seguida).
- Os workspaces **backend** e **frontend** tem **`prebuild`** e **`predev`** que garantem o build do `shared` quando voce roda `npm run build` ou `npm run dev` **dentro** de `backend/` ou `frontend/` (via `npm --prefix .. run build -w shared`).
- O backend resolve `require('shared')` contra `shared/dist` apos o build. O Vite usa alias para `shared/src` em desenvolvimento e o pacote publicado em `dist` no build de producao.

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
JWT_SECRET="defina-um-segredo-com-pelo-menos-32-caracteres-unico-para-dev"
```

Frontend (`frontend/.env`):

```env
VITE_API_URL=http://localhost:3001/api
```

Em producao, usar `NODE_ENV=production`, `JWT_SECRET` forte, `FRONTEND_URL` com o dominio oficial e, se necessario, `VITE_API_URL=/api`.

O script `backend/scripts/validate-jwt.js` roda antes do Nest em `dev`/`start`: `JWT_SECRET` precisa ter **pelo menos 32 caracteres** e nao pode ser o valor proibido antigo (`trocar-por-um-segredo-seguro`).

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

Checagem rapida do pacote `shared` antes do deploy (na raiz do monorepo):

```bash
npm install
npm run build -w shared
npm run lint -w backend
npm run lint -w frontend
npm run build -w backend
npm run build -w frontend
node -e "require('shared'); console.log('shared OK');"
```

O ultimo comando resolve o pacote a partir da raiz (workspaces). Alternativa a partir de `backend/`: `node -e "require('shared'); console.log(require('shared').UserRole.SOLICITANTE);"`.

## Deploy

1. Na raiz do repositorio: `npm install` (dispara `prepare` e compila o `shared`).
2. Opcional: `npm run build -w shared` (redundante se o passo 1 ja rodou sem `--ignore-scripts`).
3. Gerar build do frontend: `npm run build -w frontend` (o `prebuild` do frontend tambem garante o `shared`).
4. Gerar build do backend: `npm run build -w backend` (o `prebuild` do backend tambem garante o `shared`).
5. Subir o backend a partir de `backend/`: `node dist/src/main.js` (ou use o script `start` do `package.json` do backend).

No Windows, `scripts/deploy.ps1` assume a raiz do repo como pasta pai de `scripts/` e executa **build do `shared`**, depois frontend, backend, migrations e healthcheck.

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
- Servir `frontend/dist` via Nginx.
- Fazer proxy de `/api/` para `http://127.0.0.1:3001/api/`.
- Configurar `FRONTEND_URL`, `DATABASE_URL` e `JWT_SECRET` seguro no ambiente de producao.

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
