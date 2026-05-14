# Publicacao com Nginx

Este projeto ja pode ser publicado com `Nginx` servindo o frontend estatico e encaminhando a API para o backend `NestJS`.

## Visao geral

- `frontend/dist/`: arquivos estaticos gerados pelo `Vite`
- `backend`: processo Node escutando no host definido como `BACKEND_HOST` no Nginx
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
- `FRONTEND_URL=https://DOMINIO_FINAL` ou origem temporaria da VM
- `SAGAE_MUNICIPIOS_URL=http://teste.sagae.empaer.mt.gov.br:8080/api/municipios`
- `SAGAE_EXTENSIONISTAS_LOGIN_URL=http://teste.sagae.empaer.mt.gov.br:8080/api/login`
- `SAGAE_API_TOKEN=` se o SAGAe exigir token/chave de API

## 4. Configuracao do Nginx

Use como base o arquivo:

- [scripts/nginx/agendamento-atendimento.conf](/abs/c:/Agendamento_Atendimento/scripts/nginx/agendamento-atendimento.conf:1)

Esse arquivo faz:

- entrega do `frontend/dist`
- fallback para `index.html` em rotas SPA
- proxy de `/api/` para `http://BACKEND_HOST:3001/api/`
- cache para assets estaticos

## 5. Ajustes necessarios no servidor

- apontar `root` do Nginx para a pasta real onde o `frontend/dist` foi publicado
- antes do dominio, substituir `IP_DA_VM` pelo endereco temporario
- quando o dominio sair, ajustar `server_name` para `DOMINIO_FINAL`
- quando o dominio sair, configurar `SSL` com certificado valido e ativar o bloco HTTPS comentado
- garantir permissao de escrita para `backend/uploads/`

## 6. Observacao sobre o frontend

O frontend usa `/api` automaticamente quando esta em modo de producao. Isso permite publicar frontend e backend no mesmo dominio sem depender de endereco fixo no navegador.

Se voce quiser forcar outro endpoint, pode definir:

```bash
VITE_API_URL=https://api.DOMINIO_FINAL/api
```

antes da build do frontend.


