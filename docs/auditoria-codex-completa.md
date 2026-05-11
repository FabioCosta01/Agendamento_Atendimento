# Auditoria tecnica completa - Agendamento Atendimento

Data da analise: 2026-04-29

Escopo analisado: arquivos do workspace, ignorando `node_modules`, `.git`, `dist`, `build`, `target` e artefatos binarios. Foram considerados codigos de `backend`, `frontend`, `shared`, configuracoes TypeScript/ESLint/Vite/Nest, Prisma, scripts SQL, Nginx, README e documentos existentes.

## SECAO 1 - VISAO GERAL DO PROJETO

### Objetivo do sistema

O projeto implementa um sistema web para agendamento, acompanhamento e administracao de atendimentos tecnicos da Empaer-MT. O fluxo central permite que um solicitante cadastre propriedades rurais, selecione um servico, escolha uma disponibilidade de agenda tecnica e gere um protocolo de atendimento. Extensionistas gerenciam disponibilidade e atendimento; administradores gerenciam usuarios e catalogo de servicos.

### Dominio de negocio

O dominio principal e atendimento tecnico/agendamento institucional, com foco em:

- solicitantes/proprietarios;
- propriedades rurais;
- servicos tecnicos;
- agendas de extensionistas;
- protocolos de atendimento;
- anexos e QR Code;
- auditoria de acoes relevantes.

### Tipo de aplicacao

Aplicacao web interna/institucional, com caracteristicas de portal operacional e sistema administrativo. Nao e ERP completo nem microsservico; e um monolito modular com frontend SPA e backend API.

### Tecnologias e frameworks

- Monorepo: NPM Workspaces.
- Backend: NestJS 11, TypeScript, Prisma 6, MySQL/MariaDB, JWT, Helmet, Multer, QRCode.
- Frontend: React 19, Vite 6, TypeScript, Axios.
- Compartilhado: pacote `shared` com enums e tipos comuns.
- Banco: MySQL/MariaDB via Prisma.
- Deploy previsto: Nginx servindo `frontend/dist` e proxy reverso para `/api`.

### Linguagens detectadas

- TypeScript.
- TSX/React.
- JavaScript em configuracoes ESLint.
- SQL.
- Batch Windows (`start-sistema.bat`).
- Markdown.
- Configuracao Nginx.

### Servicos e integracoes externas

- Banco MySQL/MariaDB via `DATABASE_URL`.
- Nginx como reverse proxy em producao.
- Nao ha integracao implementada com e-mail, WhatsApp, pagamentos ou APIs externas. O roadmap cita notificacoes por e-mail/WhatsApp como futuro.

## SECAO 2 - ESTRUTURA DO PROJETO

```text
/
|-- backend/
|   |-- prisma/
|   |-- src/
|   |   |-- appointments/
|   |   |-- auth/
|   |   |-- availability/
|   |   |-- common/
|   |   |-- prisma/
|   |   |-- properties/
|   |   |-- security/
|   |   |-- services/
|   |   |-- users/
|   |   |-- app.*
|   |   `-- main.ts
|   |-- package.json
|   |-- tsconfig*.json
|   `-- nest-cli.json
|-- frontend/
|   |-- src/
|   |   |-- lib/
|   |   |-- pages/
|   |   |-- App.tsx
|   |   |-- main.tsx
|   |   `-- styles.css
|   |-- package.json
|   |-- vite.config.ts
|   `-- tsconfig*.json
|-- shared/
|   |-- src/
|   |-- package.json
|   `-- tsconfig.json
|-- scripts/
|   |-- nginx/
|   |-- create-database.sql
|   |-- cleanup-duplicate-services.sql
|   `-- setup-local.md
|-- docs/
|-- package.json
|-- tsconfig.base.json
`-- start-sistema.bat
```

### Responsabilidades

- `backend`: API HTTP, autenticacao, autorizacao, regras de negocio, persistencia via Prisma, upload de anexos e geracao de QR Code.
- `backend/prisma`: schema do banco, seed inicial e migracao de indices operacionais.
- `backend/src/auth`: login, JWT, guards globais, decorators de usuario atual, rotas publicas e roles.
- `backend/src/users`: CRUD administrativo de usuarios.
- `backend/src/services`: catalogo de servicos tecnicos.
- `backend/src/properties`: cadastro e consulta de propriedades.
- `backend/src/availability`: agenda de extensionistas, criacao individual/semanal, edicao e exclusao.
- `backend/src/appointments`: agendamento, status, reagendamento, anexos, QR Code e download.
- `backend/src/common`: filtro global de excecoes, interceptor de logging e alias de tipo.
- `backend/src/security`: hash e verificacao de senhas com `scrypt`.
- `frontend`: SPA React que consome a API por Axios.
- `frontend/src/lib/api.ts`: cliente HTTP tipado e armazenamento do token JWT no `localStorage`.
- `frontend/src/App.tsx`: tela principal atualmente renderizada, com login, dashboard, solicitacao, agenda, status, anexos, QR e administracao.
- `frontend/src/pages`: componentes por perfil, existentes, mas nao usados diretamente por `App.tsx` no estado atual.
- `shared`: enums `UserRole` e `AppointmentStatus` e tipos basicos compartilhados.
- `scripts`: SQL de criacao do banco, limpeza de servicos duplicados, roteiro local e Nginx.
- `docs`: documentacao existente de arquitetura, deploy, modelo inicial e roadmap.

## SECAO 3 - DOCUMENTACAO DA ARQUITETURA

### Padrao identificado

O projeto usa um monolito modular em camadas:

- Frontend SPA separado.
- Backend NestJS modular.
- Prisma como camada de acesso a dados.
- Banco relacional MySQL/MariaDB.

Nao ha microsservicos, filas, mensageria, BFF separado ou Clean Architecture estrita. Os servicos NestJS acumulam logica de aplicacao, dominio e acesso a persistencia via `PrismaService`.

### Camadas

Camada de apresentacao:

- `frontend/src/App.tsx` e componentes de `frontend/src/pages`.
- Exibe formularios, listas, status, QR Code, comprovante de impressao e acoes por perfil.
- Usa Axios em `frontend/src/lib/api.ts`.

Camada de API/aplicacao:

- Controllers NestJS recebem HTTP, DTOs e usuario autenticado.
- Services executam regras: validar permissao, validar entidades relacionadas, gerar protocolo, auditar e persistir.

Camada de dominio:

- Regras implementadas principalmente em services:
  - solicitante so cria agendamento/propriedade em nome proprio;
  - extensionista so gerencia sua agenda;
  - administrador pode visualizar/gerenciar globalmente;
  - status `REAGENDADO` e `CANCELADO` exigem justificativa;
  - disponibilidade com agendamento nao pode ser alterada/excluida;
  - capacidade do bloco de agenda e respeitada;
  - protocolo e unico por ano.

Camada de infraestrutura:

- `PrismaService` encapsula `PrismaClient`.
- Multer grava arquivos em `uploads`.
- `jsonwebtoken` assina/verifica JWT.
- `helmet`, CORS, filtros e pipes globais no bootstrap.
- Nginx previsto para frontend estatico e proxy de API.

### Interacao entre componentes

```text
Navegador React
  -> Axios com Bearer token
  -> NestJS Controller
  -> Guards globais JWT/Roles
  -> DTO + ValidationPipe
  -> Service do modulo
  -> PrismaService
  -> MySQL/MariaDB
  -> Service monta retorno
  -> Controller responde JSON
  -> Frontend atualiza estado
```

## SECAO 4 - DIAGRAMA DE MODULOS

```text
Usuario no navegador
|
v
Frontend React/Vite
|
v
Cliente Axios (`frontend/src/lib/api.ts`)
|
v
API NestJS (`/api`)
|
+--> AuthModule
|    |-- AuthController: login
|    |-- AuthMeController: usuario atual
|    |-- JwtAuthGuard: autenticacao global
|    `-- RolesGuard: autorizacao por perfil
|
+--> UsersModule
|    `-- administracao de usuarios
|
+--> ServicesModule
|    `-- catalogo de servicos
|
+--> PropertiesModule
|    `-- propriedades rurais
|
+--> AvailabilityModule
|    `-- blocos de agenda tecnica
|
+--> AppointmentsModule
|    |-- protocolos e status
|    |-- reagendamento
|    |-- anexos
|    `-- QR Code
|
v
PrismaModule / PrismaService
|
v
MySQL/MariaDB
```

Responsabilidades:

- `AuthModule`: autentica, bloqueia tentativas em memoria e gera JWT de 8 horas.
- `UsersModule`: lista, cria e atualiza usuarios; restrito a administrador.
- `ServicesModule`: lista servicos para usuarios autenticados; cria/edita para administrador.
- `PropertiesModule`: lista por papel e cria propriedades.
- `AvailabilityModule`: cria, gera semana, altera e exclui disponibilidade.
- `AppointmentsModule`: opera o ciclo de vida do atendimento.
- `PrismaModule`: acesso unico ao banco.

## SECAO 5 - DOCUMENTACAO DA API

Todas as rotas possuem prefixo global `/api`. Exceto `POST /api/auth/login`, as rotas exigem `Authorization: Bearer <token>`.

### Health

| Metodo | Rota | Controller | Parametros | Corpo | Resposta | Logica |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/health` | `AppController.healthCheck` | nenhum | nenhum | `{ status, service, timestamp }` | Verifica disponibilidade basica da API. |

### Auth

| Metodo | Rota | Controller | Parametros | Corpo | Resposta | Logica |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/auth/login` | `AuthController.login` | nenhum | `{ document, password }` | `{ message, user, token, tokenType, requiresTwoFactor }` | Procura usuario ativo por documento ou e-mail, valida senha com `scrypt`, registra auditoria `LOGIN`, aplica bloqueio em memoria apos 5 falhas em 10 min e retorna JWT. |
| GET | `/api/auth/me` | `AuthMeController.me` | Bearer token | nenhum | usuario autenticado do token | Retorna payload do JWT validado. |

### Users

Restricao: `ADMINISTRADOR`.

| Metodo | Rota | Controller | Parametros | Corpo | Resposta | Logica |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/users` | `UsersController.findAll` | nenhum | nenhum | lista de usuarios sem `passwordHash` | Lista usuarios ordenados por `createdAt desc`. |
| POST | `/api/users` | `UsersController.create` | nenhum | `CreateUserDto`: `name`, `email`, `document`, `password`, `phone?`, `role` | usuario criado sem senha | Verifica duplicidade de e-mail/documento, gera hash da senha e audita `CREATE`. |
| PATCH | `/api/users/:id` | `UsersController.update` | `id` | `UpdateUserDto`: campos opcionais de usuario | usuario atualizado | Valida existencia, duplicidade opcional, atualiza senha se enviada e audita `UPDATE`. |

### Services

| Metodo | Rota | Controller | Parametros | Corpo | Resposta | Logica |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/services` | `ServicesController.findAll` | nenhum | nenhum | lista de servicos | Lista todos os servicos ordenados por nome. Exige usuario autenticado por causa do guard global. |
| POST | `/api/services` | `ServicesController.create` | nenhum | `{ name, description?, durationMinutes, active }` | servico criado | Restrito a administrador. Valida nome unico exato, cria e audita. |
| PATCH | `/api/services/:id` | `ServicesController.update` | `id` | parcial de `CreateServiceDto` | servico atualizado | Restrito a administrador. Valida existencia, duplicidade de nome e audita. |

### Properties

| Metodo | Rota | Controller | Parametros | Corpo | Resposta | Logica |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/properties` | `PropertiesController.findAll` | nenhum | nenhum | propriedades com dono | `SOLICITANTE` ve apenas suas propriedades; demais perfis veem todas. |
| POST | `/api/properties` | `PropertiesController.create` | nenhum | `{ ownerId, ownerName, ownerDocument, ruralRegistry?, funruralCode?, displayName, city, state, address?, hasHabiteSe }` | propriedade criada com dono | Solicitante so cria para si. Verifica existencia do owner. |

### Availability

| Metodo | Rota | Controller | Parametros | Corpo | Resposta | Logica |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/availability` | `AvailabilityController.findAll` | nenhum | nenhum | lista com extensionista e contagem de appointments | `EXTENSIONISTA` ve sua agenda; demais perfis veem tudo. |
| POST | `/api/availability` | `AvailabilityController.create` | nenhum | `{ extensionistId, startDateTime, endDateTime, capacity, notes? }` | disponibilidade criada | Restrito a extensionista/admin. Valida horario, dono da agenda e usuario extensionista ativo. |
| POST | `/api/availability/weekly` | `AvailabilityController.createWeekly` | nenhum | `{ extensionistId, weekStartDate, weekdays, startTime, endTime, capacity, notes? }` | lista criada | Gera varios blocos para dias da semana. Valida horario, extensionista ativo e permissao. |
| PATCH | `/api/availability/:id` | `AvailabilityController.update` | `id` | parcial de disponibilidade | disponibilidade atualizada | Restrito. Bloqueia alteracao se ja houver agendamento no bloco. |
| DELETE | `/api/availability/:id` | `AvailabilityController.remove` | `id` | nenhum | `{ id, deleted: true }` | Restrito. Bloqueia exclusao se houver agendamento. Audita `DELETE`. |

### Appointments

| Metodo | Rota | Controller | Parametros | Corpo | Resposta | Logica |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/appointments` | `AppointmentsController.findAll` | nenhum | nenhum | lista com requester, extensionist, service, property, availability, attachments | Admin ve tudo; extensionista ve vinculados a ele ou sua agenda; solicitante ve seus registros. |
| POST | `/api/appointments` | `AppointmentsController.create` | nenhum | `{ requesterId, extensionistId?, serviceId, propertyId, availabilityId?, preferredDate, notes?, justification? }` | agendamento criado | Solicitante so cria para si. Valida solicitante ativo, servico ativo, propriedade do solicitante, capacidade da disponibilidade, calcula horario e gera protocolo unico `AGE-ANO-00001`. |
| PATCH | `/api/appointments/:protocolCode/status` | `AppointmentsController.updateStatus` | `protocolCode` | `{ status, extensionistId?, justification? }` | agendamento atualizado | Restrito a extensionista/admin. Reagendado/cancelado exigem justificativa. Atualiza status e audita `STATUS_CHANGE`. |
| PATCH | `/api/appointments/:protocolCode/reschedule` | `AppointmentsController.reschedule` | `protocolCode` | `{ availabilityId, justification }` | agendamento atualizado | Restrito. Valida acesso, disponibilidade destino, capacidade e atualiza status para `REAGENDADO`. |
| POST | `/api/appointments/:protocolCode/attachments` | `AppointmentsController.uploadAttachment` | `protocolCode`, multipart field `file` | arquivo PDF/PNG/JPG/JPEG ate 5 MB | attachment | Valida acesso ao agendamento, grava em `uploads`, salva metadados e audita. |
| GET | `/api/appointments/:protocolCode/qrcode` | `AppointmentsController.getQrCode` | `protocolCode` | nenhum | `{ protocolCode, qrCodeDataUrl, fileName }` | Valida acesso e retorna QR Code em data URL com protocolo, status, servico, propriedade e data. |
| GET | `/api/appointments/attachments/:attachmentId/download` | `AppointmentsController.downloadAttachment` | `attachmentId` | nenhum | download de arquivo | Valida acesso ao anexo e executa `response.download`. |

## SECAO 6 - ESTRUTURA DO BANCO DE DADOS

### Entidades principais

- `User`: usuarios do sistema. Campos-chave: `id`, `email` unico, `document` unico, `passwordHash`, `role`, `isActive`.
- `Service`: catalogo de servicos. Campos-chave: `id`, `name`, `durationMinutes`, `active`.
- `Property`: propriedade rural. Campos-chave: `id`, `ownerId`, `ownerName`, `ownerDocument`, `displayName`, `city`, `state`.
- `Availability`: bloco de agenda. Campos-chave: `id`, `extensionistId`, `startDateTime`, `endDateTime`, `capacity`.
- `Appointment`: protocolo/agendamento. Campos-chave: `id`, `protocolCode` unico, `requesterId`, `extensionistId`, `serviceId`, `propertyId`, `availabilityId`, `status`.
- `Attachment`: arquivo de um agendamento. Campos-chave: `id`, `appointmentId`, `fileName`, `filePath`, `mimeType`.
- `AuditLog`: auditoria simples. Campos-chave: `id`, `userId`, `entity`, `entityId`, `action`, `payload`.

### Relacionamentos

```text
User 1---N Property          (owner)
User 1---N Availability      (extensionist)
User 1---N Appointment       (requester)
User 1---N Appointment       (extensionist opcional)
User 1---N AuditLog
Service 1---N Appointment
Property 1---N Appointment
Availability 1---N Appointment
Appointment 1---N Attachment
```

### Diagrama ER simplificado

```text
User
 |--< Property >-- Appointment >-- Service
 |                  |
 |                  |--< Attachment
 |                  |
 |--< Availability >|
 |
 |--< AuditLog
```

### Indices

O schema Prisma e a migracao incluem indices para:

- `Service.active`, `Service.name`;
- `Property.ownerId`, `Property.city/state`;
- `Availability.extensionistId/startDateTime`, `Availability.startDateTime`;
- `Appointment.requesterId/createdAt`, `extensionistId/scheduledStart`, `availabilityId`, `status/createdAt`, `serviceId`, `propertyId`;
- `Attachment.appointmentId`;
- `AuditLog.userId/createdAt`, `AuditLog.entity/entityId`.

### Fluxo de dados

1. Admin cria usuarios e servicos.
2. Solicitante cria propriedade.
3. Extensionista cria disponibilidade.
4. Solicitante cria appointment usando servico, propriedade e opcionalmente disponibilidade.
5. Sistema gera `protocolCode`.
6. Extensionista/admin aprova, conclui, cancela ou reagenda.
7. Anexos e QR Code ficam vinculados ao protocolo.
8. Acoes sensiveis geram registros em `AuditLog`.

## SECAO 7 - FLUXO DE EXECUCAO

### Login

```text
POST /api/auth/login
-> AuthController
-> AuthService.ensureLoginAllowed
-> Prisma User findFirst(document/email + isActive)
-> verifyPassword
-> AuditLog LOGIN
-> JwtService.signToken
-> resposta com token
```

### Requisicao autenticada

```text
HTTP com Authorization Bearer
-> JwtAuthGuard global
-> JwtService.verifyToken
-> request.user
-> RolesGuard global, se houver @Roles
-> ValidationPipe global valida DTO
-> Controller
-> Service
-> PrismaService
-> Banco
-> HttpExceptionFilter padroniza erros, se houver
-> JSON response
```

### Criacao de agendamento

```text
Frontend createAppointment
-> POST /api/appointments
-> JwtAuthGuard
-> AppointmentsController.create
-> AppointmentsService.create
-> valida requester, service, property, availability
-> verifica propriedade pertence ao solicitante
-> verifica capacidade da disponibilidade
-> calcula scheduledStart/scheduledEnd
-> generateProtocolCode
-> Prisma appointment.create com retry em conflito unico
-> AuditLog CREATE
-> retorna appointment completo
```

### Upload de anexo

```text
Frontend FormData
-> Multer FileInterceptor grava arquivo em uploads
-> ParseFilePipe valida tamanho e extensao/mime
-> AppointmentsService.createAttachment
-> valida acesso ao protocolo
-> Prisma Attachment.create
-> AuditLog CREATE
-> retorna metadados
```

## SECAO 8 - README TECNICO

### Descricao

Sistema web institucional para agendamento e acompanhamento de atendimentos tecnicos, com perfis `SOLICITANTE`, `EXTENSIONISTA` e `ADMINISTRADOR`.

### Pilha de tecnologias

- Node.js >= 22 e npm >= 10.
- Monorepo NPM Workspaces.
- Backend NestJS 11 + TypeScript + Prisma + MySQL/MariaDB.
- Frontend React 19 + Vite 6 + Axios.
- Shared TypeScript para enums/tipos.
- Nginx opcional em producao.

### Requisitos

- Node.js 22+.
- npm 10+.
- MySQL ou MariaDB.
- Banco `agendamento_atendimento`.

### Variaveis de ambiente

Backend `backend/.env`:

```env
NODE_ENV="development"
DATABASE_URL="mysql://root:@localhost:3306/agendamento_atendimento"
PORT=3001
FRONTEND_URL="http://localhost:5173"
JWT_SECRET="trocar-por-um-segredo-seguro"
```

Frontend `frontend/.env`:

```env
VITE_API_URL=http://localhost:3001/api
```

Em producao:

- definir `NODE_ENV=production`;
- usar `JWT_SECRET` forte;
- definir `FRONTEND_URL` com o dominio oficial;
- usar `VITE_API_URL=/api` quando frontend e API estiverem no mesmo dominio via Nginx.

### Instalacao local

```bash
npm install
```

Criar banco:

```sql
CREATE DATABASE IF NOT EXISTS agendamento_atendimento
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Gerar Prisma Client e aplicar schema:

```bash
npm run prisma:generate
cd backend
npx prisma db push
```

Seed opcional:

```bash
npm run seed -w backend
```

Credenciais do seed:

- admin: documento `00000000000`, senha `123456`;
- extensionista: documento `11111111111`, senha `123456`;
- solicitante: documento `22222222222`, senha `123456`.

### Execucao local

Backend:

```bash
npm run backend:dev
```

Frontend:

```bash
npm run frontend:dev
```

Ou no Windows:

```bat
start-sistema.bat
```

URLs:

- Frontend: `http://localhost:5173`
- API: `http://localhost:3001/api`
- Health: `http://localhost:3001/api/health`

### Build

```bash
npm run build
```

Build separado:

```bash
npm run build -w shared
npm run build -w backend
npm run build -w frontend
```

### Validacao

```bash
npm run lint
npm run test -w backend
```

### Deploy

1. Build do frontend: `npm run build -w frontend`.
2. Build do backend: `npm run build -w backend`.
3. Configurar `.env` de producao no backend.
4. Subir backend com `node dist/src/main.js`.
5. Servir `frontend/dist` via Nginx.
6. Proxy de `/api/` para `http://127.0.0.1:3001/api/`.
7. Garantir escrita em `backend/uploads/`.
8. Configurar TLS/SSL no Nginx.

### Visao geral da API

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/health`
- `GET|POST|PATCH /api/users`
- `GET|POST|PATCH /api/services`
- `GET|POST /api/properties`
- `GET|POST|PATCH|DELETE /api/availability`
- `POST /api/availability/weekly`
- `GET|POST /api/appointments`
- `PATCH /api/appointments/:protocolCode/status`
- `PATCH /api/appointments/:protocolCode/reschedule`
- `POST /api/appointments/:protocolCode/attachments`
- `GET /api/appointments/:protocolCode/qrcode`
- `GET /api/appointments/attachments/:attachmentId/download`

## SECAO 9 - QUALIDADE DO CODIGO E MELHORIAS

### Pontos positivos

- Arquitetura modular por dominio no backend.
- Uso de DTOs e `ValidationPipe` global com `whitelist` e `forbidNonWhitelisted`.
- Guards globais para JWT e roles.
- Senhas com `scrypt` e `timingSafeEqual`.
- CORS configurado por origem conhecida.
- Helmet habilitado.
- Prisma com indices operacionais relevantes.
- Regras de permissao aplicadas no backend, nao apenas no frontend.
- Auditoria basica para login, criacao, update, delete e mudanca de status.

### Divida tecnica

- Frontend tem duas abordagens concorrentes: `App.tsx` monolitico em uso e componentes `pages/*` parcialmente redundantes. Isso aumenta manutencao e risco de divergencia.
- Logica de negocio e acesso a dados estao acoplados nos services NestJS. Para crescer, pode ser util separar repositorios ou uma camada de dominio.
- Codigo de auditoria esta duplicado em varios services.
- Nao ha DTOs formais de resposta para a maioria das rotas, apesar de alguns arquivos existirem.
- Nao ha paginacao/filtros nos endpoints de listagem.
- Nao ha testes cobrindo controllers, services principais, permissao por perfil, capacidade de agenda, upload ou fluxo de agendamento.
- `deleteAttachmentIfOrphaned` nao e usado no fluxo atual.

### Problemas arquiteturais

- `AuthService` usa bloqueio de login em memoria (`Map`). Isso nao funciona bem com multiplas instancias, restart do processo ou ambiente clusterizado.
- Geracao de protocolo consulta o ultimo codigo e incrementa. Existe retry para colisao, mas em alta concorrencia ainda pode haver repetidas colisoes; uma sequencia transacional ou tabela de contador seria mais robusta.
- `Service.name` e verificado por igualdade exata, mas nao ha constraint unica no banco. Servicos com variacao de caixa/espacos podem duplicar.
- `Property` armazena `ownerName` e `ownerDocument` duplicados alem da relacao com `User`; pode ficar inconsistente quando usuario muda nome/documento.
- `Availability.createMany` nao previne duplicidade de horarios.

### Escalabilidade

- Listagens retornam todos os registros; isso pode degradar com muitos agendamentos/anexos.
- Frontend faz `Promise.allSettled` de varios endpoints para montar dashboard; sem paginacao, o payload cresce rapido.
- Upload salva em filesystem local. Em multiplas instancias, e melhor usar storage compartilhado ou objeto externo.
- QR Code e gerado sob demanda sem cache, aceitavel agora, mas pode ser cacheado se houver muito uso.

### Seguranca

- JWT e armazenado em `localStorage`, sujeito a impacto maior em caso de XSS. Cookies HttpOnly/SameSite podem reduzir exposicao.
- Nao ha refresh token nem revogacao de token.
- Nao ha controle persistente de tentativas de login; o bloqueio em memoria e facil de perder em restart.
- Upload valida tipo/tamanho, mas nao ha antivirus, armazenamento fora da pasta publica, nem normalizacao/varredura de conteudo.
- `response.download(attachment.filePath)` usa caminho salvo no banco; hoje o caminho vem do Multer, mas em caso de corrupcao/manipulacao do banco pode haver risco. Recomenda-se resolver caminho dentro de diretorio base permitido.
- Erros sao padronizados, mas logs podem conter URLs e mensagens sensiveis; revisar politica de logging antes de producao.
- Seed usa senha padrao `123456`; deve ser usado apenas localmente.

### Recomendacoes

1. Consolidar frontend: escolher entre `App.tsx` monolitico ou paginas modulares e remover/ativar o que nao for usado.
2. Criar testes de service para `AppointmentsService`, `AvailabilityService`, `AuthService`, `UsersService` e `ServicesService`.
3. Adicionar paginacao, filtros por status/data e busca nos endpoints principais.
4. Mover auditoria para um servico dedicado (`AuditService`) reutilizavel.
5. Adicionar constraints/normalizacao para nomes unicos de servicos.
6. Substituir rate limit em memoria por solucao persistente/distribuida ou middleware como throttler com storage adequado.
7. Melhorar ciclo de autenticacao: refresh token, expiracao configuravel, logout/revogacao e opcionalmente cookie HttpOnly.
8. Criar politica formal de upload: diretorio absoluto configuravel, whitelist por MIME real, extensao segura, antivirus e limite por usuario/protocolo.
9. Introduzir migrations completas do Prisma em vez de depender apenas de `db push` para ambientes controlados.
10. Separar regras mais complexas em services menores ou dominio dedicado conforme crescimento.
11. Criar OpenAPI/Swagger para documentacao automatica da API.
12. Revisar deploy com processo gerenciado (`systemd`, PM2 ou container) e logs estruturados.

