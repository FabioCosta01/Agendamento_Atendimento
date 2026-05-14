# Logs

Os arquivos de log da aplicacao devem ficar fora do versionamento.

## Desenvolvimento

- Use a pasta `logs/development/` para saidas temporarias de testes locais.
- Nao grave logs na raiz do repositorio, em `backend/` ou em `frontend/`.
- Os logs locais sao ignorados pelo Git por `.gitignore`.

## Producao

- Use a pasta `logs/production/` somente quando o processo nao estiver sob `systemd`, PM2, Docker ou outro gerenciador com coleta propria.
- Em producao, prefira encaminhar stdout/stderr para o gerenciador de processos e configurar rotacao de logs no sistema operacional.
- Nao registrar tokens, senhas, JWT, `DATABASE_URL`, dados de login ou payloads completos de requisicao.
- URLs registradas pelo backend devem remover query string para evitar vazamento de parametros sensiveis.

## Padrao de nomes

- `backend-dev.out.log`
- `backend-dev.err.log`
- `frontend-dev.out.log`
- `frontend-dev.err.log`
- `backend-production.out.log`
- `backend-production.err.log`
