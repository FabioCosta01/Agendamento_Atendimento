import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserRole } from 'shared';

import type { AuthenticatedUser } from '../auth/auth.types';
import { NotificacoesService } from '../notificacoes/notificacoes.service';
import { PrismaService } from '../prisma/prisma.service';

import { AtualizarStatusAgendamentoDto } from './dto/atualizar-status-agendamento.dto';
import { CriarAgendamentoDto } from './dto/criar-agendamento.dto';
import { ReagendarAgendamentoDto } from './dto/reagendar-agendamento.dto';

@Injectable()
export class AgendamentosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificacoesService,
  ) {}

  async findAll(user?: AuthenticatedUser) {
    return this.prisma.appointment.findMany({
      where: this.buildWhereForUser(user),
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            document: true,
            phone: true,
          },
        },
        extensionist: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        service: true,
        property: true,
        availability: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async create(createAppointmentDto: CriarAgendamentoDto, user: AuthenticatedUser) {
    if (user.role === UserRole.SOLICITANTE && createAppointmentDto.requesterId !== user.id) {
      throw new BadRequestException('Solicitante so pode abrir agendamento em nome proprio');
    }

    if (!createAppointmentDto.availabilityId) {
      throw new BadRequestException('Selecione um horario disponivel da agenda');
    }

    const [requester, service, property, availability] = await Promise.all([
      this.prisma.user.findFirst({
        where: {
          id: createAppointmentDto.requesterId,
          isActive: true,
        },
        select: { id: true, role: true },
      }),
      this.prisma.service.findUnique({
        where: { id: createAppointmentDto.serviceId },
        select: { id: true, durationMinutes: true, active: true },
      }),
      this.prisma.property.findUnique({
        where: { id: createAppointmentDto.propertyId },
        select: { id: true, ownerId: true },
      }),
      createAppointmentDto.availabilityId
        ? this.prisma.availability.findUnique({
            where: { id: createAppointmentDto.availabilityId },
            select: {
              id: true,
              startDateTime: true,
              endDateTime: true,
              extensionistId: true,
              capacity: true,
            },
          })
        : Promise.resolve(null),
    ]);

    if (!requester) {
      throw new NotFoundException('Solicitante nao encontrado');
    }

    if (!service || !service.active) {
      throw new NotFoundException('Servico nao encontrado ou inativo');
    }

    if (!property) {
      throw new NotFoundException('Propriedade nao encontrada');
    }

    if (property.ownerId !== createAppointmentDto.requesterId) {
      throw new BadRequestException('A propriedade informada nao pertence ao solicitante');
    }

    if (!availability) {
      throw new NotFoundException('Horario selecionado nao encontrado');
    }

    this.ensureFutureAvailability(availability.startDateTime);

    const scheduledStart = availability?.startDateTime ?? null;
    const scheduledEnd =
      availability && service
        ? new Date(availability.startDateTime.getTime() + service.durationMinutes * 60 * 1000)
        : null;

    const appointment = await this.prisma.$transaction(
      async (tx) => {
        await this.ensureAvailabilityCapacity(tx, availability.id, availability.capacity);

        return this.createAppointmentWithProtocolRetry(
          {
            requesterId: createAppointmentDto.requesterId,
            extensionistId: availability.extensionistId,
            serviceId: createAppointmentDto.serviceId,
            propertyId: createAppointmentDto.propertyId,
            availabilityId: createAppointmentDto.availabilityId ?? null,
            preferredDate: createAppointmentDto.preferredDate,
            scheduledStart,
            scheduledEnd,
            notes: createAppointmentDto.notes,
            justification: createAppointmentDto.justification,
          },
          tx,
        );
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    await this.createAuditLog(user.id, 'Appointment', appointment.id, 'CREATE', {
      protocolCode: appointment.protocolCode,
      status: appointment.status,
    });

    return appointment;
  }

  async updateStatus(protocolCode: string, updateStatusDto: AtualizarStatusAgendamentoDto, user: AuthenticatedUser) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { protocolCode },
      include: {
        service: {
          select: {
            durationMinutes: true,
          },
        },
        availability: {
          select: {
            startDateTime: true,
            extensionistId: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento nao encontrado');
    }

    if (user.role === UserRole.SOLICITANTE) {
      throw new BadRequestException('Solicitante nao pode alterar status do agendamento');
    }

    this.ensureAppointmentAccess(appointment, user);
    this.ensureStatusTransition(appointment.status, updateStatusDto.status);

    if (
      ['REAGENDADO', 'CANCELADO'].includes(updateStatusDto.status) &&
      !updateStatusDto.justification?.trim()
    ) {
      throw new BadRequestException('Justificativa obrigatoria para reagendamento ou cancelamento');
    }

    const nextExtensionistId =
      updateStatusDto.extensionistId ?? appointment.extensionistId ?? appointment.availability?.extensionistId;

    if (user.role === UserRole.EXTENSIONISTA && nextExtensionistId !== user.id) {
      throw new ForbiddenException('Extensionista so pode alterar atendimentos da propria agenda');
    }

    const updatedAppointment = await this.prisma.appointment.update({
      where: { protocolCode },
      data: {
        status: updateStatusDto.status,
        justification: updateStatusDto.justification,
        extensionistId: nextExtensionistId,
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            document: true,
            phone: true,
          },
        },
        extensionist: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        service: true,
        property: true,
        availability: true,
      },
    });

    await this.createAuditLog(user.id, 'Appointment', updatedAppointment.id, 'STATUS_CHANGE', {
      protocolCode,
      status: updateStatusDto.status,
      justification: updateStatusDto.justification,
    });

    if (updateStatusDto.status === 'CANCELADO') {
      await this.notificationsService.create(
        updatedAppointment.requesterId,
        `Atendimento ${protocolCode} cancelado`,
        [
          `Seu atendimento ${protocolCode} foi cancelado.`,
          `Servico: ${updatedAppointment.service.name}.`,
          updatedAppointment.scheduledStart
            ? `Data original: ${updatedAppointment.scheduledStart.toLocaleDateString('pt-BR')}.`
            : '',
          updateStatusDto.justification ? `Justificativa: ${updateStatusDto.justification}.` : '',
        ]
          .filter(Boolean)
          .join('\n'),
      );
    }

    return updatedAppointment;
  }

  async reschedule(protocolCode: string, rescheduleAppointmentDto: ReagendarAgendamentoDto, user: AuthenticatedUser) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { protocolCode },
      include: {
        service: {
          select: {
            durationMinutes: true,
          },
        },
        availability: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento nao encontrado');
    }

    this.ensureAppointmentAccess(appointment, user);
    this.ensureCanRescheduleStatus(appointment.status);

    const availability = await this.prisma.availability.findUnique({
      where: { id: rescheduleAppointmentDto.availabilityId },
      select: {
        id: true,
        startDateTime: true,
        extensionistId: true,
        capacity: true,
      },
    });

    if (!availability) {
      throw new NotFoundException('Horario de destino nao encontrado');
    }

    this.ensureFutureAvailability(availability.startDateTime);

    if (user.role === UserRole.EXTENSIONISTA && availability.extensionistId !== user.id) {
      throw new ForbiddenException('Extensionista so pode reagendar para a propria agenda');
    }

    const scheduledStart = availability.startDateTime;
    const scheduledEnd = new Date(
      availability.startDateTime.getTime() + appointment.service.durationMinutes * 60 * 1000,
    );

    const updatedAppointment = await this.prisma.$transaction(
      async (tx) => {
        await this.ensureAvailabilityCapacity(tx, availability.id, availability.capacity, appointment.id);

        return tx.appointment.update({
          where: { protocolCode },
          data: {
            availabilityId: availability.id,
            extensionistId: availability.extensionistId,
            scheduledStart,
            scheduledEnd,
            preferredDate: scheduledStart,
            status: 'REAGENDADO',
            justification: rescheduleAppointmentDto.justification,
          },
          include: {
            requester: {
              select: {
                id: true,
                name: true,
                email: true,
                document: true,
                phone: true,
              },
            },
            extensionist: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            service: true,
            property: true,
            availability: true,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    await this.createAuditLog(user.id, 'Appointment', updatedAppointment.id, 'STATUS_CHANGE', {
      protocolCode,
      status: 'REAGENDADO',
      availabilityId: availability.id,
      justification: rescheduleAppointmentDto.justification,
    });

    await this.notificationsService.create(
      updatedAppointment.requesterId,
      `Atendimento ${protocolCode} reagendado`,
      [
        `Seu atendimento ${protocolCode} foi reagendado.`,
        `Nova data: ${scheduledStart.toLocaleDateString('pt-BR')}.`,
        `Horario: ${scheduledStart.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.`,
        `Servico: ${updatedAppointment.service.name}.`,
        `Justificativa: ${rescheduleAppointmentDto.justification}.`,
      ].join('\n'),
    );

    return updatedAppointment;
  }

  private async generateProtocolCode(tx: Prisma.TransactionClient = this.prisma) {
    const year = new Date().getFullYear();
    const currentYearPrefix = `AGE-${year}-`;

    const latestAppointment = await tx.appointment.findFirst({
      where: {
        protocolCode: {
          startsWith: currentYearPrefix,
        },
      },
      orderBy: {
        protocolCode: 'desc',
      },
      select: {
        protocolCode: true,
      },
    });

    const lastNumber = latestAppointment
      ? Number(latestAppointment.protocolCode.split('-').at(-1))
      : 0;

    return `${currentYearPrefix}${String(lastNumber + 1).padStart(5, '0')}`;
  }

  private async createAppointmentWithProtocolRetry(
    data: Omit<Prisma.AppointmentUncheckedCreateInput, 'protocolCode'>,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const protocolCode = await this.generateProtocolCode(tx);

      try {
        return await tx.appointment.create({
          data: {
            ...data,
            protocolCode,
          },
          include: {
            requester: {
              select: {
                id: true,
                name: true,
                email: true,
                document: true,
                phone: true,
              },
            },
            extensionist: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            service: true,
            property: true,
            availability: true,
          },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002' &&
          attempt < 2
        ) {
          continue;
        }

        throw error;
      }
    }

    throw new BadRequestException('Nao foi possivel gerar protocolo unico');
  }

  private buildWhereForUser(user?: AuthenticatedUser) {
    if (!user || user.role === UserRole.ADMINISTRADOR) {
      return undefined;
    }

    if (user.role === UserRole.EXTENSIONISTA) {
      return {
        OR: [{ extensionistId: user.id }, { availability: { extensionistId: user.id } }],
      };
    }

    return {
      requesterId: user.id,
    };
  }

  private ensureAppointmentAccess(
    appointment: {
      requesterId: string;
      extensionistId?: string | null;
      availability?: { extensionistId: string } | null;
    },
    user: AuthenticatedUser,
  ) {
    if (user.role === UserRole.ADMINISTRADOR) {
      return;
    }

    if (user.role === UserRole.EXTENSIONISTA) {
      if (
        appointment.extensionistId === user.id ||
        appointment.availability?.extensionistId === user.id
      ) {
        return;
      }

      throw new ForbiddenException('Extensionista sem permissao para este protocolo');
    }

    if (appointment.requesterId !== user.id) {
      throw new ForbiddenException('Solicitante sem permissao para este protocolo');
    }
  }

  private ensureFutureAvailability(startDateTime: Date) {
    if (startDateTime < new Date()) {
      throw new BadRequestException('Nao e permitido agendar ou reagendar para data ou horario passado');
    }
  }

  private ensureStatusTransition(currentStatus: string, nextStatus: string) {
    const allowedTransitions: Record<string, string[]> = {
      SOLICITADO: ['APROVADO', 'REAGENDADO', 'CANCELADO'],
      APROVADO: ['CONCLUIDO', 'CANCELADO', 'REAGENDADO'],
      REAGENDADO: ['APROVADO', 'CONCLUIDO', 'CANCELADO', 'REAGENDADO'],
      CANCELADO: [],
      CONCLUIDO: [],
    };

    if (!allowedTransitions[currentStatus]?.includes(nextStatus)) {
      throw new BadRequestException('Mudanca de status nao permitida para este protocolo');
    }
  }

  private ensureCanRescheduleStatus(status: string) {
    if (['CANCELADO', 'CONCLUIDO'].includes(status)) {
      throw new BadRequestException('Protocolo cancelado ou concluido nao pode ser reagendado');
    }
  }

  private async ensureAvailabilityCapacity(
    tx: Prisma.TransactionClient,
    availabilityId: string,
    capacity: number,
    ignoreAppointmentId?: string,
  ) {
    const currentCount = await tx.appointment.count({
      where: {
        availabilityId,
        id: ignoreAppointmentId ? { not: ignoreAppointmentId } : undefined,
        status: {
          in: ['SOLICITADO', 'APROVADO', 'REAGENDADO', 'CONCLUIDO'],
        },
      },
    });

    if (currentCount >= capacity) {
      throw new BadRequestException('Nao ha mais vagas neste bloco de horario');
    }
  }

  private async createAuditLog(
    userId: string,
    entity: string,
    entityId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'STATUS_CHANGE',
    payload?: Prisma.InputJsonObject,
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
