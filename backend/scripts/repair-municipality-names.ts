import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function extractServiceMunicipalities() {
  const seedPath = join(__dirname, '..', 'prisma', 'seed.ts');
  const seed = readFileSync(seedPath, 'utf8');
  const match = seed.match(/const serviceMunicipalities = \[([\s\S]*?)\];/);

  if (!match) {
    throw new Error('Lista serviceMunicipalities nao encontrada em prisma/seed.ts');
  }

  const arraySource = `[${match[1]}]`;
  return Function(`"use strict"; return ${arraySource};`)() as string[];
}

function toBrokenDatabaseName(value: string) {
  return value.replace(/[^\x00-\x7F]/g, '??');
}

async function main() {
  const municipalities = extractServiceMunicipalities();
  let updated = 0;

  for (const correctName of municipalities) {
    const brokenName = toBrokenDatabaseName(correctName);

    if (brokenName === correctName) {
      continue;
    }

    const result = await prisma.serviceMunicipality.updateMany({
      where: {
        name: brokenName,
        state: 'MT',
      },
      data: {
        name: correctName,
      },
    });

    updated += result.count;
  }

  console.log(`Municipios corrigidos: ${updated}`);
}

void main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
