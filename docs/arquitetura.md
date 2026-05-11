# Arquitetura

## Visao geral

O projeto foi organizado como monorepo com tres pacotes:

- `frontend`: aplicacao React para operacao do sistema
- `backend`: API NestJS com regras de negocio e acesso ao banco
- `shared`: enums e contratos comuns

## Backend

- `NestJS` para modularizacao
- `Prisma` para mapear o banco `MySQL/MariaDB`
- `ValidationPipe` global para validacao de entrada
- CORS liberado para o frontend local

## Frontend

- `React + Vite + TypeScript`
- rotas separadas por perfil
- layout inicial responsivo
- telas base para visao geral, solicitante, extensionista e administrador

## Banco

- provider configurado para `mysql`
- pronto para uso com ambiente local do `XAMPP`
- entidades modeladas no schema inicial do Prisma
