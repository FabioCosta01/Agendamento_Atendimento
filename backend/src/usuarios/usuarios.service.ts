import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from 'shared';

import type { AuthenticatedUser } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { hashPassword } from '../security/password';

import { AtualizarUsuarioDto } from './dto/atualizar-usuario.dto';
import { CadastrarSolicitanteDto } from './dto/cadastrar-solicitante.dto';
import { CriarUsuarioDto } from './dto/criar-usuario.dto';

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        email: true,
        document: true,
        phone: true,
        role: true,
        attendanceMunicipalities: {
          select: {
            municipality: {
              select: {
                id: true,
                name: true,
                state: true,
              },
            },
          },
        },
        isActive: true,
        createdAt: true,
      },
    });
  }

  async findRequesters() {
    return this.prisma.user.findMany({
      where: {
        role: UserRole.SOLICITANTE,
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        email: true,
        document: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async create(createUserDto: CriarUsuarioDto, actor?: AuthenticatedUser) {
    const data = this.normalizeUserPayload(createUserDto);
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { document: data.document }],
      },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('Ja existe usuario com este e-mail ou documento');
    }

    const municipalityIds =
      data.role === UserRole.EXTENSIONISTA
        ? await this.resolveAttendanceMunicipalityIds(data.attendanceMunicipalityIds)
        : [];

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        document: data.document,
        passwordHash: hashPassword(data.password),
        phone: data.phone,
        role: data.role,
        attendanceMunicipalities: {
          create: municipalityIds.map((municipalityId) => ({ municipalityId })),
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        document: true,
        phone: true,
        role: true,
        attendanceMunicipalities: {
          select: {
            municipality: {
              select: {
                id: true,
                name: true,
                state: true,
              },
            },
          },
        },
        isActive: true,
        createdAt: true,
      },
    });

    if (actor) {
      await this.createAuditLog(actor.id, 'User', user.id, 'CREATE', {
        role: user.role,
        email: user.email,
      });
    }

    return user;
  }

  async registerRequester(registerRequesterDto: CadastrarSolicitanteDto) {
    const data = this.normalizeRequesterRegistration(registerRequesterDto);
    const email = `${data.document}@cadastro.local`;
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { document: data.document }],
      },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('Ja existe cadastro para este CPF');
    }

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email,
        document: data.document,
        passwordHash: hashPassword(data.password),
        phone: data.phone,
        role: UserRole.SOLICITANTE,
      },
      select: {
        id: true,
        name: true,
        email: true,
        document: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return user;
  }

  async update(id: string, updateUserDto: AtualizarUsuarioDto, actor?: AuthenticatedUser) {
    const data = this.normalizeUserPayload(updateUserDto);

    if (actor?.id === id && data.isActive === false) {
      throw new BadRequestException('Administrador nao pode desativar o proprio usuario');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    if (data.email || data.document) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          id: { not: id },
          OR: [
            data.email ? { email: data.email } : undefined,
            data.document ? { document: data.document } : undefined,
          ].filter(Boolean) as Array<{ email: string } | { document: string }>,
        },
        select: { id: true },
      });

      if (existingUser) {
        throw new ConflictException('Ja existe usuario com este e-mail ou documento');
      }
    }

    const nextRole = (data.role ?? user.role) as UserRole;
    const shouldUpdateMunicipalities = data.attendanceMunicipalityIds !== undefined || nextRole !== UserRole.EXTENSIONISTA;
    const municipalityIds =
      nextRole === UserRole.EXTENSIONISTA && data.attendanceMunicipalityIds !== undefined
        ? await this.resolveAttendanceMunicipalityIds(data.attendanceMunicipalityIds)
        : [];

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        document: data.document,
        passwordHash: data.password ? hashPassword(data.password) : undefined,
        phone: data.phone,
        role: data.role,
        isActive: data.isActive,
        attendanceMunicipalities: shouldUpdateMunicipalities
          ? {
              deleteMany: {},
              create: municipalityIds.map((municipalityId) => ({ municipalityId })),
            }
          : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        document: true,
        phone: true,
        role: true,
        attendanceMunicipalities: {
          select: {
            municipality: {
              select: {
                id: true,
                name: true,
                state: true,
              },
            },
          },
        },
        isActive: true,
        createdAt: true,
      },
    });

    if (actor) {
      await this.createAuditLog(actor.id, 'User', updatedUser.id, 'UPDATE', {
        role: updatedUser.role,
        isActive: updatedUser.isActive,
      });
    }

    return updatedUser;
  }

  private normalizeUserPayload<T extends Partial<CriarUsuarioDto & AtualizarUsuarioDto>>(payload: T) {
    const name = payload.name?.trim().replace(/\s+/g, ' ');
    const document = payload.document?.replace(/\D/g, '');

    if (payload.name !== undefined && !name) {
      throw new BadRequestException('Nome do usuario e obrigatorio');
    }

    if (document && document.length < 11) {
      throw new BadRequestException('Documento deve ter pelo menos 11 digitos');
    }

    if (payload.password && payload.password === '123456') {
      throw new BadRequestException('Use uma senha diferente da senha padrao');
    }

    return {
      ...payload,
      name,
      email: payload.email?.trim().toLowerCase(),
      document,
      phone: payload.phone?.replace(/\D/g, ''),
      attendanceMunicipalityIds: payload.attendanceMunicipalityIds?.map((id) => id.trim()).filter(Boolean),
    };
  }

  private async resolveAttendanceMunicipalityIds(attendanceMunicipalityIds?: string[]) {
    const uniqueIds = Array.from(new Set(attendanceMunicipalityIds ?? []));

    if (uniqueIds.length === 0) {
      return [];
    }

    const municipalities = await this.prisma.serviceMunicipality.findMany({
      where: {
        id: { in: uniqueIds },
        active: true,
      },
      select: { id: true },
    });

    if (municipalities.length !== uniqueIds.length) {
      throw new BadRequestException('Um ou mais municipios de atendimento nao foram encontrados ou estao inativos');
    }

    return uniqueIds;
  }

  private normalizeRequesterRegistration(payload: CadastrarSolicitanteDto) {
    const document = payload.document.replace(/\D/g, '');
    const phone = payload.phone.replace(/\D/g, '');
    const name = payload.name.trim().replace(/\s+/g, ' ');
    const community = payload.community.trim().replace(/\s+/g, ' ');
    const city = payload.city.trim().replace(/\s+/g, ' ');
    const password = payload.password.trim();

    if (!this.isValidCpf(document)) {
      throw new BadRequestException('CPF invalido');
    }

    if (password.length < 8) {
      throw new BadRequestException('Senha deve ter pelo menos 8 caracteres');
    }

    if (password.replace(/\D/g, '') === document || password === '12345678') {
      throw new BadRequestException('Use uma senha diferente do CPF e de senhas comuns');
    }

    if (phone.length < 10) {
      throw new BadRequestException('Telefone deve ter DDD e numero');
    }

    if (!name || !community || !city) {
      throw new BadRequestException('Preencha todos os dados do cadastro');
    }

    return {
      document,
      name,
      password,
      phone,
      community,
      city,
    };
  }

  private isValidCpf(document: string) {
    if (!/^\d{11}$/.test(document) || /^(\d)\1{10}$/.test(document)) {
      return false;
    }

    const digits = document.split('').map(Number);
    const firstCheck = this.calculateCpfCheckDigit(digits.slice(0, 9), 10);
    const secondCheck = this.calculateCpfCheckDigit([...digits.slice(0, 9), firstCheck], 11);

    return digits[9] === firstCheck && digits[10] === secondCheck;
  }

  private calculateCpfCheckDigit(numbers: number[], weight: number) {
    const sum = numbers.reduce((total, number) => {
      const nextTotal = total + number * weight;
      weight -= 1;

      return nextTotal;
    }, 0);
    const remainder = (sum * 10) % 11;

    return remainder === 10 ? 0 : remainder;
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
