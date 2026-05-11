# Setup local

## Banco local

1. Iniciar `Apache` e `MySQL` no XAMPP.
2. Criar o banco `agendamento_atendimento` ou executar `scripts/create-database.sql`.
3. Copiar `backend/.env.example` para `backend/.env`.
4. Definir um `JWT_SECRET` seguro se for usar fora do ambiente local.
5. Ajustar a senha do MySQL, se necessario.

## Comandos principais

```bash
npm install
npm run prisma:generate
cd backend && npx prisma db push
npm run backend:dev
npm run frontend:dev
```
