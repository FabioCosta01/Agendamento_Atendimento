import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from 'shared';

import type { AuthenticatedUser } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';

import { AtualizarPropriedadeDto } from './dto/atualizar-propriedade.dto';
import { CriarPropriedadeDto } from './dto/criar-propriedade.dto';

@Injectable()
export class PropriedadesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: AuthenticatedUser, ownerId?: string) {
    const where = user.role === UserRole.SOLICITANTE ? { ownerId: user.id } : ownerId ? { ownerId } : undefined;

    return this.prisma.property.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            document: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async create(createPropertyDto: CriarPropriedadeDto, user: AuthenticatedUser) {
    if (user.role === UserRole.SOLICITANTE) {
      throw new ForbiddenException('Solicitante nao pode cadastrar propriedades');
    }

    const data = this.normalizePropertyPayload(createPropertyDto);

    const owner = await this.prisma.user.findUnique({
      where: { id: data.ownerId },
      select: { id: true },
    });

    if (!owner) {
      throw new NotFoundException('Usuario proprietario nao encontrado');
    }

    return this.prisma.property.create({
      data,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            document: true,
          },
        },
      },
    });
  }

  async delete(id: string, user: AuthenticatedUser) {
    if (user.role === UserRole.SOLICITANTE) {
      throw new ForbiddenException('Solicitante nao pode remover propriedades');
    }

    const property = await this.prisma.property.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!property) {
      throw new NotFoundException('Propriedade nao encontrada');
    }

    await this.prisma.property.delete({
      where: { id },
    });

    return { id };
  }

  async update(id: string, updatePropertyDto: AtualizarPropriedadeDto, user: AuthenticatedUser) {
    if (user.role === UserRole.SOLICITANTE) {
      throw new ForbiddenException('Solicitante nao pode editar propriedades');
    }

    const property = await this.prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      throw new NotFoundException('Propriedade nao encontrada');
    }

    const data = this.normalizePropertyUpdatePayload(updatePropertyDto);

    const updated = await this.prisma.property.update({
      where: { id },
      data,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            document: true,
          },
        },
      },
    });

    return updated;
  }

  private normalizePropertyUpdatePayload(payload: AtualizarPropriedadeDto) {
    const data: Partial<CriarPropriedadeDto> = {};

    if (payload.displayName !== undefined) {
      const displayName = payload.displayName.trim().replace(/\s+/g, ' ');
      if (!displayName) {
        throw new BadRequestException('Nome da propriedade e obrigatorio');
      }
      data.displayName = displayName;
    }

    if (payload.city !== undefined) {
      const city = payload.city.trim().replace(/\s+/g, ' ');
      if (!city) {
        throw new BadRequestException('Municipio e obrigatorio');
      }
      data.city = city;
    }

    if (payload.state !== undefined) {
      const state = payload.state.trim().toUpperCase();
      if (state.length !== 2) {
        throw new BadRequestException('UF deve ter 2 letras');
      }
      data.state = state;
    }

    if (payload.address !== undefined) {
      data.address = payload.address.trim();
    }

    if (payload.ruralRegistry !== undefined) {
      data.ruralRegistry = payload.ruralRegistry.trim();
    }

    if (payload.funruralCode !== undefined) {
      data.funruralCode = payload.funruralCode.trim();
    }

    if (payload.hasHabiteSe !== undefined) {
      data.hasHabiteSe = payload.hasHabiteSe;
    }

    return data;
  }

  private normalizePropertyPayload(payload: CriarPropriedadeDto) {
    const state = payload.state.trim().toUpperCase();
    const ownerDocument = payload.ownerDocument.replace(/\D/g, '');
    const ownerName = payload.ownerName.trim().replace(/\s+/g, ' ');
    const displayName = payload.displayName.trim().replace(/\s+/g, ' ');
    const city = payload.city.trim().replace(/\s+/g, ' ');

    if (state.length !== 2) {
      throw new BadRequestException('UF deve ter 2 letras');
    }

    if (ownerDocument.length < 11) {
      throw new BadRequestException('Documento do proprietario invalido');
    }

    if (!ownerName || !displayName || !city) {
      throw new BadRequestException('Nome do proprietario, propriedade e municipio sao obrigatorios');
    }

    return {
      ...payload,
      ownerName,
      ownerDocument,
      displayName,
      city,
      state,
      address: payload.address?.trim(),
      ruralRegistry: payload.ruralRegistry?.trim(),
      funruralCode: payload.funruralCode?.trim(),
    };
  }
}
