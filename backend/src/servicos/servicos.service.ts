import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import type { AuthenticatedUser } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';

import { AtualizarServicoDto } from './dto/atualizar-servico.dto';
import { CriarServicoDto } from './dto/criar-servico.dto';

@Injectable()
export class ServicosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.service.findMany({
      orderBy: [{ classification: 'asc' }, { name: 'asc' }],
    });
  }

  async create(createServiceDto: CriarServicoDto, actor?: AuthenticatedUser) {
    const data = this.normalizeServicePayload(createServiceDto);
    const existingService = await this.prisma.service.findFirst({
      where: {
        name: data.name,
      },
      select: { id: true },
    });

    if (existingService) {
      throw new ConflictException('Ja existe servico com este nome');
    }

    const service = await this.prisma.service.create({
      data,
    });

    if (actor) {
      await this.createAuditLog(actor.id, 'Service', service.id, 'CREATE', {
        name: service.name,
        active: service.active,
      });
    }

    return service;
  }

  async update(id: string, updateServiceDto: AtualizarServicoDto, actor?: AuthenticatedUser) {
    const data = this.normalizeServicePayload(updateServiceDto);
    const service = await this.prisma.service.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!service) {
      throw new NotFoundException('Servico nao encontrado');
    }

    if (data.name) {
      const existingService = await this.prisma.service.findFirst({
        where: {
          id: { not: id },
          name: data.name,
        },
        select: { id: true },
      });

      if (existingService) {
        throw new ConflictException('Ja existe servico com este nome');
      }
    }

    const updatedService = await this.prisma.service.update({
      where: { id },
      data,
    });

    if (actor) {
      await this.createAuditLog(actor.id, 'Service', updatedService.id, 'UPDATE', {
        name: updatedService.name,
        active: updatedService.active,
      });
    }

    return updatedService;
  }

  private normalizeServicePayload<T extends Partial<CriarServicoDto>>(payload: T) {
    if (payload.durationMinutes && payload.durationMinutes > 480) {
      throw new BadRequestException('Duracao maxima do servico e 480 minutos');
    }

    const name = payload.name?.trim().replace(/\s+/g, ' ');
    const classification = payload.classification?.trim().replace(/\s+/g, ' ');

    if (payload.name !== undefined && !name) {
      throw new BadRequestException('Nome do servico e obrigatorio');
    }

    if (payload.classification !== undefined && !classification) {
      throw new BadRequestException('Classificacao do servico e obrigatoria');
    }

    return {
      ...payload,
      name,
      classification,
      description: payload.description?.trim(),
    };
  }

  private async createAuditLog(
    userId: string,
    entity: string,
    entityId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'STATUS_CHANGE',
    payload?: Record<string, string | boolean>,
  ) {
    await this.prisma.auditLog
      .create({
        data: {
          userId,
          entity,
          entityId,
          action,
          payload,
        },
      })
      .catch(() => undefined);
  }
}
