import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      role: 'SOLICITANTE',
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      document: true,
      isActive: true,
    },
  });
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
