process.loadEnvFile('.env');

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const checks: Array<{ name: string; ok: boolean; detail?: string }> = [];

  const databaseRows = await prisma.$queryRaw<Array<{ database_name: string | null }>>`SELECT DATABASE() AS database_name`;
  const databaseName = databaseRows[0]?.database_name;
  checks.push({
    name: 'database_connection',
    ok: Boolean(databaseName),
    detail: databaseName ?? 'database not selected',
  });

  if (databaseName) {
    const charsetRows = await prisma.$queryRaw<Array<{ character_set_name: string; collation_name: string }>>`
      SELECT DEFAULT_CHARACTER_SET_NAME AS character_set_name, DEFAULT_COLLATION_NAME AS collation_name
      FROM information_schema.SCHEMATA
      WHERE SCHEMA_NAME = ${databaseName}
    `;
    const charset = charsetRows[0];
    checks.push({
      name: 'database_charset',
      ok: charset?.character_set_name === 'utf8mb4',
      detail: charset ? `${charset.character_set_name}/${charset.collation_name}` : 'not found',
    });

    const actionEnumRows = await prisma.$queryRaw<Array<{ column_type: string }>>`
      SELECT COLUMN_TYPE AS column_type
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ${databaseName}
        AND TABLE_NAME = 'auditoria'
        AND COLUMN_NAME = 'acao'
    `;
    const actionEnum = actionEnumRows[0]?.column_type ?? '';
    checks.push({
      name: 'audit_action_password_reset',
      ok: actionEnum.includes('PASSWORD_RESET'),
      detail: actionEnum || 'column not found',
    });
  }

  const migrationCount = await prisma.$queryRaw<Array<{ total: bigint }>>`
    SELECT COUNT(*) AS total FROM _prisma_migrations WHERE finished_at IS NOT NULL
  `;
  checks.push({
    name: 'migrations_applied',
    ok: Number(migrationCount[0]?.total ?? 0) > 0,
    detail: String(migrationCount[0]?.total ?? 0),
  });

  const adminCount = await prisma.user.count({
    where: {
      role: 'ADMINISTRADOR',
      isActive: true,
    },
  });
  checks.push({
    name: 'active_admin_user',
    ok: adminCount > 0,
    detail: String(adminCount),
  });

  const failed = checks.filter((check) => !check.ok);
  for (const check of checks) {
    console.log(`${check.ok ? 'OK' : 'FAIL'} ${check.name}${check.detail ? ` - ${check.detail}` : ''}`);
  }

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

void main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
