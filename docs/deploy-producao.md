# Deploy de producao

Checklist objetivo para publicar o Agendamento Atendimento sem depender das rotas do SAGAe.

## Requisitos

- Node.js 22 ou superior.
- npm 10 ou superior.
- MySQL/MariaDB com banco `agendamento_atendimento`.
- Nginx ou proxy reverso equivalente com HTTPS.
- Supervisor do backend: PM2, servico Windows, systemd, Docker ou equivalente.

## Variaveis

Backend:

```env
NODE_ENV=production
DATABASE_URL=mysql://USUARIO:SENHA@HOST:3306/agendamento_atendimento
PORT=3001
FRONTEND_URL=https://seu-dominio
TRUST_PROXY=true
JWT_SECRET=segredo-forte-com-mais-de-32-caracteres
JWT_EXPIRES_IN=8h
JWT_ISSUER=agendamento-atendimento
JWT_AUDIENCE=agendamento-atendimento-client
```

Use `TRUST_PROXY=true` somente se o backend nao ficar acessivel diretamente e receber trafego apenas do proxy reverso.

Frontend:

```env
VITE_API_URL=/api
```

## Validacao antes de publicar

Na raiz do repositorio:

```powershell
npm run predeploy
```

Se o banco de producao ainda nao estiver acessivel no momento da validacao:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/predeploy.ps1 -SkipDatabase
```

## Migrations

No servidor, depois de configurar o `.env` do backend:

```powershell
cd backend
npx prisma migrate deploy --schema prisma/schema.prisma
cd ..
npm run db:validate
```

## Build

```powershell
npm run build
```

O frontend fica em `frontend/dist`. O backend roda por `backend/dist/src/main.js`.

## Backend

Nao use `nest start --watch` em producao.

Exemplo com PM2:

```powershell
cd backend
pm2 start dist/src/main.js --name agendamento-atendimento
pm2 save
```

## Nginx

Use `scripts/nginx/agendamento-atendimento.conf` como base:

- `/` serve `frontend/dist`.
- `/api/` faz proxy para `http://127.0.0.1:3001/api/`.
- HTTPS obrigatorio.
- HTTP deve redirecionar para HTTPS.

## Backup

Gerar backup manual:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/backup-mysql.ps1
```

Guarde os arquivos da pasta `backups/` fora do servidor de aplicacao ou em armazenamento protegido.

## Pos-deploy

Validar:

```powershell
Invoke-WebRequest https://seu-dominio/api/health
```

O retorno esperado deve ter:

- `status: ok`
- `database: ok`
- `environment: production`

## Pendencias conhecidas

- Integracao SAGAe para municipios e extensionistas.
- Canal oficial para entrega segura de senha provisoria na recuperacao de senha.
