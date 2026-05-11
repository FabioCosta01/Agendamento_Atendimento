import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PontosAtendimentoService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.serviceMunicipality.findMany({
      where: {
        active: true,
      },
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        state: true,
        active: true,
      },
    });
  }
}
