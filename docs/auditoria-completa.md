# Auditoria Completa do Projeto

Data da analise: 2026-04-24.

Escopo lido: arquivos de codigo-fonte, configuracao, Prisma, scripts SQL, Nginx, documentacao, testes e cliente API. Foram ignorados `node_modules`, `.git`, `dist`, `build`, `target`, logs e artefatos binarios. Observacao: ha uma pasta `backend/uploads` com arquivo de exemplo; ela foi tratada como artefato operacional.

## Secao 1 - Visao Geral do Projeto

O projeto implementa uma plataforma institucional de agendamento de atendimentos tecnicos para a Empaer-MT. O dominio principal e a gestao de solicitacoes de atendimento, propriedades rurais, servicos ofertados, disponibilidade de extensionistas, protocolos, anexos e QR Code de acompanhamento.

Tipo de aplicacao: sistema interno web, com arquitetura monolitica modular em monorepo. Nao ha microsservicos; ha um backend unico, um frontend SPA e um pacote compartilhado.

Tecnologias detectadas:

- TypeScript em todo o codigo principal.
- Backend NestJS, Prisma ORM, MySQL/MariaDB, JWT, Helmet, Multer e QRCode.
- Frontend React, Vite, React Router e Axios.
- NPM Workspaces para organizar `backend`, `frontend` e `shared`.
- Nginx previsto para publicar o frontend e encaminhar `/api`.

Integracoes externas ou servicos:

- Banco MySQL/MariaDB via `DATABASE_URL`.
- Navegador/localStorage para persistencia do token no frontend.
- Sistema de arquivos local para upload em `backend/uploads`.
- Nginx opcional para proxy reverso.
- Nao ha integracao implementada com e-mail, WhatsApp, gateways ou provedores externos.

## Secao 2 - Estrutura do Projeto

```text
/
|-- backend/
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
|   |   |-- app.module.ts
|   |   |-- app.controller.ts
|   |   |-- app.service.ts
|   |   |-- app.config.ts
|   |   |-- main.ts
|   |-- prisma/
|   |   |-- schema.prisma
|   |   |-- seed.ts
|   |-- uploads/
|-- frontend/
|   |-- src/
|   |   |-- lib/
|   |   |-- pages/
|   |   |-- App.tsx
|   |   |-- main.tsx
|   |   |-- styles.css
|-- shared/
|   |-- src/
|   |   |-- index.ts
|-- docs/
|-- scripts/
|   |-- nginx/
|   |-- create-database.sql
|   |-- setup-local.md
```

Responsabilidades:

- `backend/src`: API HTTP, regras de negocio, autenticacao, validacao, acesso a dados e infraestrutura de runtime.
- `backend/src/auth`: login, JWT, usuario corrente, guards globais e decoradores de papel/publicidade.
- `backend/src/users`: CRUD parcial de usuarios, restrito a administradores.
- `backend/src/services`: catalogo de servicos de atendimento.
- `backend/src/properties`: propriedades/imoveis vinculados a solicitantes.
- `backend/src/availability`: blocos de agenda de extensionistas.
- `backend/src/appointments`: agendamentos, status, protocolos, anexos, download e QR Code.
- `backend/src/common`: filtro global de excecoes, interceptor de logging e tipo de usuario da requisicao.
- `backend/src/security`: hash e verificacao de senha com `scrypt`.
- `backend/src/prisma`: `PrismaService` global.
- `backend/prisma`: schema relacional e seed inicial.
- `frontend/src/lib`: cliente Axios, tipos de payload/resposta e helpers de token.
- `frontend/src/pages`: telas por fluxo: login, dashboard, solicitante, extensionista e administrador.
- `shared/src`: enums `UserRole`, `AppointmentStatus` e tipos comuns.
- `scripts`: criacao do banco, setup local e configuracao Nginx.
- `docs`: documentacao existente de arquitetura, deploy, modelo e roadmap.

## Secao 3 - Documentacao da Arquitetura

Padrao arquitetural predominante: monolito modular com arquitetura em camadas. No backend, cada modulo NestJS agrupa controlador, servico, DTOs e dependencias de Prisma.

Camada de apresentacao:

- Frontend React em SPA.
- Rotas client-side: `/`, `/solicitante`, `/extensionista`, `/admin`.
- Componentes de tela consomem `frontend/src/lib/api.ts`.

Camada de API/aplicacao:

- Controladores NestJS recebem HTTP, extraem `Body`, `Param`, arquivo e usuario autenticado.
- DTOs com `class-validator` e `class-transformer` fazem validacao de entrada.
- `ValidationPipe` global usa `whitelist`, `transform` e `forbidNonWhitelisted`.

Camada de servico/dominio:

- Services NestJS concentram regras de negocio:
  - login e auditoria de login;
  - criacao de usuarios com unicidade de e-mail/documento;
  - restricoes por perfil em propriedades, agenda e agendamentos;
  - validacao de capacidade de horario;
  - geracao de protocolo;
  - permissao de acesso a anexos e QR Code.

Camada de infraestrutura:

- `PrismaService` encapsula conexao com MySQL/MariaDB.
- `Multer` grava arquivos em `uploads`.
- `QRCode` gera data URL.
- `Helmet`, CORS, filtro de excecao e logging sao configurados em `main.ts`.

Interacao entre componentes:

```text
Browser React
  -> Axios com Bearer token
  -> NestJS Controller
  -> Guards globais JWT/roles
  -> ValidationPipe e DTOs
  -> Service de dominio
  -> PrismaService
  -> MySQL/MariaDB
  -> resposta JSON ou download
```

## Secao 4 - Diagrama de Modulos

```text
Cliente React SPA
|
v
Cliente Axios / Token localStorage
|
v
API NestJS (/api)
|
+-- AuthModule
|   |-- AuthController
|   |-- AuthMeController
|   |-- JwtAuthGuard / RolesGuard
|   `-- JwtService
|
+-- UsersModule
|   `-- UsersService -> User
|
+-- ServicesModule
|   `-- ServicesService -> Service
|
+-- PropertiesModule
|   `-- PropertiesService -> Property / User
|
+-- AvailabilityModule
|   `-- AvailabilityService -> Availability / User
|
+-- AppointmentsModule
|   `-- AppointmentsService -> Appointment / Attachment / QRCode / uploads
|
v
PrismaModule / PrismaService
|
v
MySQL/MariaDB
```

Responsabilidades e fluxo:

- `AuthModule`: autentica e injeta usuario autenticado nas requisicoes.
- `UsersModule`: administra usuarios.
- `ServicesModule`: mantem catalogo de servicos.
- `PropertiesModule`: gerencia propriedades vinculadas ao solicitante.
- `AvailabilityModule`: controla blocos de agenda.
- `AppointmentsModule`: controla o ciclo principal de atendimento.
- `PrismaModule`: acesso a dados compartilhado por todos os modulos.

## Secao 5 - Documentacao da API

Prefixo global: `/api`.

Autenticacao: todas as rotas exigem JWT Bearer, exceto `POST /auth/login`, marcada com `@Public()`.

Formato padrao de erro:

```json
{
  "statusCode": 400,
  "message": "mensagem",
  "path": "/api/rota",
  "timestamp": "2026-04-24T00:00:00.000Z"
}
```

### Geral

`GET /api/health`

- Controlador: `AppController.healthCheck`.
- Auth: protegida pelo guard global, pois nao possui `@Public()`.
- Corpo: nenhum.
- Resposta: `{ "status": "ok", "service": "agendamento-atendimento-api", "timestamp": "..." }`.
- Logica: confirma que a aplicacao esta ativa.

### Auth

`POST /api/auth/login`

- Controlador: `AuthController.login`.
- Auth: publica.
- Corpo: `{ "document": "string", "password": "string minimo 6" }`.
- Regra: busca usuario ativo por documento ou e-mail; valida senha com `scrypt`; grava `AuditLog` de `LOGIN`.
- Resposta: `{ message, user, token, tokenType: "Bearer", requiresTwoFactor: false }`.

`GET /api/auth/me`

- Controlador: `AuthMeController.me`.
- Auth: qualquer usuario autenticado.
- Resposta: usuario extraido do JWT: `id`, `name`, `email`, `document`, `role`.

### Users

`GET /api/users`

- Controlador: `UsersController.findAll`.
- Auth: `ADMINISTRADOR`.
- Resposta: lista de usuarios com `id`, `name`, `email`, `document`, `phone`, `role`, `isActive`, `createdAt`.
- Logica: ordena por `createdAt desc`.

`POST /api/users`

- Controlador: `UsersController.create`.
- Auth: `ADMINISTRADOR`.
- Corpo: `name`, `email`, `document`, `password`, `phone?`, `role`.
- Regra: impede e-mail/documento duplicados; salva senha com hash.
- Resposta: usuario criado sem `passwordHash`.

### Services

`GET /api/services`

- Controlador: `ServicesController.findAll`.
- Auth: autenticado.
- Resposta: lista completa de servicos ordenada por nome.

`POST /api/services`

- Controlador: `ServicesController.create`.
- Auth: `ADMINISTRADOR`.
- Corpo: `name`, `description?`, `durationMinutes >= 15`, `active`.
- Resposta: servico criado.

### Properties

`GET /api/properties`

- Controlador: `PropertiesController.findAll`.
- Auth: autenticado.
- Regra: `SOLICITANTE` ve apenas suas propriedades; outros perfis veem todas.
- Resposta: propriedades com `owner` resumido.

`POST /api/properties`

- Controlador: `PropertiesController.create`.
- Auth: autenticado.
- Corpo: `ownerId`, `ownerName`, `ownerDocument`, `ruralRegistry?`, `funruralCode?`, `displayName`, `city`, `state`, `address?`, `hasHabiteSe`.
- Regra: solicitante so cadastra propriedade propria; valida existencia do proprietario.
- Resposta: propriedade criada com `owner` resumido.

### Availability

`GET /api/availability`

- Controlador: `AvailabilityController.findAll`.
- Auth: autenticado.
- Regra: extensionista ve apenas seus blocos; outros perfis veem todos.
- Resposta: blocos com dados resumidos do extensionista.

`POST /api/availability`

- Controlador: `AvailabilityController.create`.
- Auth: `EXTENSIONISTA` ou `ADMINISTRADOR`.
- Corpo: `extensionistId`, `startDateTime`, `endDateTime`, `capacity >= 1`, `notes?`.
- Regra: fim deve ser maior que inicio; extensionista so cadastra agenda propria; usuario alvo deve estar ativo e ter papel `EXTENSIONISTA`.
- Resposta: disponibilidade criada com extensionista.

### Appointments

`GET /api/appointments`

- Controlador: `AppointmentsController.findAll`.
- Auth: autenticado.
- Regra: administrador ve tudo; extensionista ve vinculados a ele ou a sua disponibilidade; solicitante ve apenas seus pedidos.
- Resposta: agendamentos com requester, extensionist, service, property, availability e attachments.

`POST /api/appointments`

- Controlador: `AppointmentsController.create`.
- Auth: autenticado.
- Corpo: `requesterId`, `extensionistId?`, `serviceId`, `propertyId`, `availabilityId?`, `preferredDate`, `notes?`, `justification?`.
- Regra: solicitante so abre em nome proprio; valida solicitante ativo, servico ativo e propriedade; propriedade deve pertencer ao solicitante; se houver disponibilidade, respeita `capacity`.
- Resposta: agendamento criado com protocolo `AGE-ANO-00001`, horarios calculados e relacionamentos.

`PATCH /api/appointments/:protocolCode/status`

- Controlador: `AppointmentsController.updateStatus`.
- Auth: `EXTENSIONISTA` ou `ADMINISTRADOR`.
- Parametro: `protocolCode`.
- Corpo: `status`, `extensionistId?`, `justification?`.
- Regra: `REAGENDADO` e `CANCELADO` exigem justificativa; atualiza status, justificativa e extensionista.
- Resposta: agendamento atualizado com relacionamentos.

`POST /api/appointments/:protocolCode/attachments`

- Controlador: `AppointmentsController.uploadAttachment`.
- Auth: autenticado.
- Parametro: `protocolCode`.
- Corpo multipart: campo `file`.
- Validacoes: ate 5 MB; extensao/tipo compatível com `pdf`, `png`, `jpg`, `jpeg`.
- Regra: usuario precisa ter acesso ao agendamento.
- Resposta: registro do anexo.

`GET /api/appointments/:protocolCode/qrcode`

- Controlador: `AppointmentsController.getQrCode`.
- Auth: autenticado.
- Parametro: `protocolCode`.
- Regra: usuario precisa ter acesso ao agendamento.
- Resposta: `{ protocolCode, qrCodeDataUrl, fileName }`.

`GET /api/appointments/attachments/:attachmentId/download`

- Controlador: `AppointmentsController.downloadAttachment`.
- Auth: autenticado.
- Parametro: `attachmentId`.
- Regra: usuario precisa ter acesso ao agendamento do anexo.
- Resposta: download do arquivo via `response.download`.

## Secao 6 - Estrutura do Banco de Dados

Banco: MySQL/MariaDB via Prisma.

Entidades:

- `User`: usuarios com `role`, documento/e-mail unicos e senha hash.
- `Service`: catalogo de servicos e duracao.
- `Property`: propriedade rural vinculada a um `User` proprietario.
- `Availability`: bloco de agenda de um extensionista.
- `Appointment`: solicitacao/protocolo principal.
- `Attachment`: arquivo vinculado a um agendamento.
- `AuditLog`: trilha de auditoria, hoje usada no login.

Relacionamentos:

- `User 1:N Property` por `Property.ownerId`.
- `User 1:N Availability` por `Availability.extensionistId`.
- `User 1:N Appointment` como solicitante por `Appointment.requesterId`.
- `User 1:N Appointment` como extensionista por `Appointment.extensionistId`.
- `Service 1:N Appointment`.
- `Property 1:N Appointment`.
- `Availability 1:N Appointment`.
- `Appointment 1:N Attachment`.
- `User 1:N AuditLog`.

Diagrama ER simplificado:

```text
User
 |--< Property
 |      `--< Appointment >-- Service
 |              |
 |              |--< Attachment
 |
 |--< Availability --< Appointment
 |
 `--< AuditLog
```

Campos-chave:

- `User.email` e `User.document` sao unicos.
- `Appointment.protocolCode` e unico.
- IDs usam `cuid()`.
- `createdAt` e `updatedAt` existem na maioria das entidades.

Fluxo de dados:

1. Administrador cria usuarios e servicos.
2. Solicitante cadastra propriedade propria.
3. Extensionista cria blocos de disponibilidade.
4. Solicitante cria agendamento com servico, propriedade e horario.
5. Sistema gera protocolo e permite anexos/QR Code.
6. Extensionista ou administrador altera status.

## Secao 7 - Fluxo de Execucao

Fluxo geral:

```text
Requisicao HTTP
  -> CORS/Helmet
  -> prefixo /api
  -> JwtAuthGuard
  -> RolesGuard
  -> ValidationPipe
  -> Controller
  -> Service
  -> PrismaService
  -> MySQL/MariaDB ou filesystem
  -> filtro global de erro ou resposta
```

Exemplo de criacao de agendamento:

1. Frontend envia `POST /api/appointments` com token e payload.
2. `JwtAuthGuard` valida Bearer token.
3. `CreateAppointmentDto` converte e valida `preferredDate`.
4. `AppointmentsController.create` chama `AppointmentsService.create`.
5. Service valida solicitante, servico, propriedade, disponibilidade e capacidade.
6. Service gera `protocolCode`.
7. Prisma cria o registro em `Appointment`.
8. Backend retorna o agendamento com relacionamentos.
9. Frontend atualiza o dashboard e exibe protocolo.

## Secao 8 - README Tecnico

O README tecnico foi consolidado em `README.md`, contendo descricao, stack, requisitos, variaveis de ambiente, instalacao, execucao local, build, deploy e visao geral da API.

## Secao 9 - Qualidade do Codigo e Melhorias

Pontos positivos:

- Separacao clara por modulos NestJS.
- Guards globais para JWT e roles.
- `ValidationPipe` configurado com whitelist e rejeicao de campos extras.
- Senha armazenada com hash `scrypt` e comparacao `timingSafeEqual`.
- `JWT_SECRET` obrigatorio e validacao mais rigida em producao.
- Upload com limite de tamanho e tipo.
- Testes basicos de JWT e senha passam.

Divida tecnica e riscos:

- `GET /api/health` esta protegido por JWT; para health check de infraestrutura, normalmente deveria ser publico ou haver outro endpoint publico.
- `POST /api/services` exige `active` obrigatorio mesmo o banco ja tendo default `true`; isso aumenta atrito no cliente.
- `createAppointment` permite `extensionistId` livre sem validar se o usuario existe e tem papel `EXTENSIONISTA`, quando nao vem de uma disponibilidade.
- `updateStatus` nao registra `AuditLog`, embora status seja uma acao critica.
- `generateProtocolCode` busca o ultimo protocolo e incrementa em memoria; sob concorrencia, duas requisicoes podem tentar o mesmo codigo.
- Upload grava arquivos no disco local sem estrategia de antivirus, armazenamento externo, limpeza transacional ou isolamento por tenant/entidade.
- `deleteAttachmentIfOrphaned` existe, mas nao e usado por nenhuma rota.
- O frontend salva JWT em `localStorage`; isso e simples, mas mais exposto a XSS que cookie HttpOnly.
- Nao ha refresh token, revogacao de sessao ou expiracao configuravel.
- Nao ha rate limit para login.
- O retorno de `GET /services` inclui servicos inativos; pode ser correto para administracao, mas para solicitante talvez devesse filtrar.
- Nao ha paginacao ou filtros nas listagens principais.
- Regras de transicao de status sao permissivas; qualquer status enum pode substituir qualquer outro.
- A autorizacao de `POST /properties` permite que extensionista crie propriedade para qualquer owner existente; se isso nao for intencional, precisa restringir.
- O schema Prisma nao define indices adicionais para buscas frequentes como `requesterId`, `extensionistId`, `availabilityId`, `createdAt` e `status`.
- Nao ha migrations versionadas no repositorio; o setup usa `db push`, bom para desenvolvimento, mas fraco para producao.
- Testes cobrem apenas JWT e senha; faltam testes de servicos, guards, regras de permissao, capacidade e upload.
- Logs de runtime estao no workspace; devem permanecer fora do versionamento.

Recomendacoes:

1. Tornar `/api/health` publico ou criar `/api/health/public` para load balancer.
2. Criar migrations Prisma versionadas e fluxo de deploy com `prisma migrate deploy`.
3. Adicionar indice e/ou transacao para geracao de protocolo, evitando colisao concorrente.
4. Validar `extensionistId` em criacao e alteracao de agendamento.
5. Registrar auditoria para criacao de agendamento, mudanca de status, uploads e alteracoes administrativas.
6. Implementar paginacao, filtros e ordenacao em listagens.
7. Implementar matriz explicita de transicoes de status.
8. Adicionar rate limiting em login e endpoints sensiveis.
9. Avaliar cookie HttpOnly/SameSite para token ou endurecer CSP contra XSS.
10. Externalizar uploads para storage gerenciado ou, no minimo, organizar por entidade e implementar rotina de limpeza.
11. Expandir testes unitarios e de integracao para os modulos de dominio.
12. Documentar respostas da API com OpenAPI/Swagger.
13. Separar endpoints administrativos e operacionais quando as regras de listagem crescerem.
14. Revisar o frontend para ocultar telas/acoes conforme role, nao apenas desabilitar ou avisar visualmente.

## Validacao executada

Comando executado:

```bash
npm run test -w backend
```

Resultado: 2 testes passaram (`JwtService` e `hashPassword/verifyPassword`).
