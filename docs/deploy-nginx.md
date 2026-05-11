# Publicacao com Nginx

Este projeto ja pode ser publicado com `Nginx` servindo o frontend estatico e encaminhando a API para o backend `NestJS`.

## Visao geral

- `frontend/dist/`: arquivos estaticos gerados pelo `Vite`
- `backend`: processo Node escutando, por exemplo, em `127.0.0.1:3001`
- `Nginx`: entrega o frontend e faz proxy reverso para `/api`

## 1. Gerar build do frontend

No diretorio raiz do projeto:

1. Crie o arquivo `frontend/.env.production` com base em `frontend/.env.production.example`.
2. Gere a build:

```bash
npm run build -w frontend
```

O resultado sera criado em `frontend/dist`.

## 2. Gerar build do backend

```bash
npm run build -w backend
```

Depois disso, suba o backend em modo de producao com variaveis corretas:

```bash
cd backend
node dist/src/main.js
```

## 3. Variaveis importantes do backend

Em `backend/.env`, para producao:

- `NODE_ENV=production`
- `PORT=3001`
- `JWT_SECRET` forte
- `DATABASE_URL` apontando para o banco de producao
- `FRONTEND_URL=https://seu-dominio-oficial`

## 4. Configuracao do Nginx

Use como base o arquivo:

- [scripts/nginx/agendamento-atendimento.conf](/abs/c:/Agendamento_Atendimento/scripts/nginx/agendamento-atendimento.conf:1)

Esse arquivo faz:

- entrega do `frontend/dist`
- fallback para `index.html` em rotas SPA
- proxy de `/api/` para `127.0.0.1:3001`
- cache para assets estaticos

## 5. Ajustes necessarios no servidor

- apontar `root` do Nginx para a pasta real onde o `frontend/dist` foi publicado
- ajustar `server_name` para o dominio oficial
- configurar `SSL` com certificado valido
- garantir permissao de escrita para `backend/uploads/`

## 6. Observacao sobre o frontend

O frontend agora usa `/api` automaticamente quando esta em modo de producao. Isso permite publicar frontend e backend no mesmo dominio sem depender de `localhost:3001` no navegador.

Se voce quiser forcar outro endpoint, pode definir:

```bash
VITE_API_URL=https://api.seu-dominio.gov.br/api
```

antes da build do frontend.
