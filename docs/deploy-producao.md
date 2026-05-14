# Deploy de producao

Checklist objetivo para deixar o Agendamento Atendimento pronto para producao mesmo antes da VM e do dominio definitivo.

## Requisitos

- Node.js 22 ou superior.
- npm 10 ou superior.
- MySQL/MariaDB com banco `agendamento_atendimento`.
- Nginx ou proxy reverso equivalente com HTTPS.
- Supervisor do backend: PM2, servico Windows, systemd, Docker ou equivalente.

## Variaveis

Backend (`backend/.env.production.example`):

```env
NODE_ENV=production
DATABASE_URL=mysql://USUARIO_BANCO:SENHA_BANCO@HOST_BANCO:3306/agendamento_atendimento
PORT=3001
FRONTEND_URL=https://DOMINIO_FINAL
TRUST_PROXY=true
SAGAE_MUNICIPIOS_URL=http://teste.sagae.empaer.mt.gov.br:8080/api/municipios
SAGAE_EXTENSIONISTAS_LOGIN_URL=http://teste.sagae.empaer.mt.gov.br:8080/api/login
SAGAE_API_TOKEN=
JWT_SECRET=TROCAR_POR_SEGREDO_FORTE_COM_MAIUSCULAS_minusculas_123_E_SIMBOLOS!
JWT_EXPIRES_IN=8h
JWT_ISSUER=agendamento-atendimento
JWT_AUDIENCE=agendamento-atendimento-client
```

Use `TRUST_PROXY=true` somente se o backend nao ficar acessivel diretamente e receber trafego apenas do proxy reverso.

Frontend (`frontend/.env.production.example`):

```env
VITE_API_URL=/api
```

Antes do dominio definitivo, substitua `DOMINIO_FINAL` pelo IP/nome temporario da VM no `FRONTEND_URL` e no `server_name` do Nginx. Quando o dominio for liberado, volte esses valores para a URL final com HTTPS.

Valores que precisam ser preenchidos no deploy:

- `DATABASE_URL`: usuario, senha, host e porta reais do MySQL/MariaDB.
- `FRONTEND_URL`: origem publica exata do frontend, sem barra final. Aceita multiplas origens separadas por virgula durante transicao.
- `JWT_SECRET`: segredo forte, unico por ambiente, com letras maiusculas, minusculas, numeros e simbolos.
- `SAGAE_MUNICIPIOS_URL`: URL da API de municipios do SAGAe.
- `SAGAE_EXTENSIONISTAS_LOGIN_URL`: URL de autenticacao/validacao de extensionistas do SAGAe.
- `SAGAE_API_TOKEN`: token/chave opcional do SAGAe, nunca exposto no frontend.
- `VITE_API_URL`: `/api` quando frontend e backend estao no mesmo dominio/proxy; URL completa se a API estiver em outro host.
- `DOMINIO_FINAL`, `IP_DA_VM`, `BACKEND_HOST`: placeholders do Nginx.

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

Use `scripts/nginx/agendamento-atendimento.conf` como base.

- `/` serve `frontend/dist`.
- `/api/` faz proxy para `http://BACKEND_HOST:3001/api/`.
- Antes do dominio, use `server_name IP_DA_VM _;`.
- Depois do dominio, substitua `DOMINIO_FINAL`, emita SSL e ative o bloco HTTPS comentado no arquivo.

Para emitir HTTPS quando o dominio apontar para a VM:

```bash
sudo certbot --nginx -d DOMINIO_FINAL
sudo nginx -t
sudo systemctl reload nginx
```

## Backup

Gerar backup manual:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/backup-mysql.ps1
```

Guarde os arquivos da pasta `backups/` fora do servidor de aplicacao ou em armazenamento protegido.

## Pos-deploy

Validar:

```powershell
Invoke-WebRequest https://DOMINIO_FINAL/api/health
```

O retorno esperado deve ter:

- `status: ok`
- `database: ok`
- `environment: production`

## Pendencias conhecidas

- Canal oficial para entrega segura de senha provisoria na recuperacao de senha.


