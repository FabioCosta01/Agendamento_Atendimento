import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from 'shared';

import type { AuthenticatedUser } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';

import { AtualizarDisponibilidadeAgendaDto } from './dto/atualizar-disponibilidade-agenda.dto';
import { CriarDisponibilidadeAgendaDto } from './dto/criar-disponibilidade-agenda.dto';
import { CriarDisponibilidadeSemanalDto } from './dto/criar-disponibilidade-semanal.dto';

@Injectable()
export class DisponibilidadeAgendaService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: AuthenticatedUser) {
    const availability = await this.prisma.availability.findMany({
      where:
        user.role === UserRole.EXTENSIONISTA
          ? { extensionistId: user.id }
          : user.role === UserRole.SOLICITANTE
            ? {
                startDateTime: { gt: new Date() },
                municipality: {
                  is: {
                    active: true,
                  },
                },
              }
            : undefined,
      include: {
        extensionist: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        municipality: {
          select: {
            id: true,
            name: true,
            state: true,
          },
        },
        _count: {
          select: {
            appointments: true,
          },
        },
        appointments:
          user.role === UserRole.SOLICITANTE
            ? {
                select: {
                  status: true,
                },
              }
            : false,
      },
      orderBy: {
        startDateTime: 'asc',
      },
    });

    if (user.role !== UserRole.SOLICITANTE) {
      return availability;
    }

    return availability
      .filter((slot) => {
        const usedCapacity = slot.appointments.filter((appointment) =>
          ['SOLICITADO', 'APROVADO', 'REAGENDADO', 'CONCLUIDO'].includes(appointment.status),
        ).length;

        return usedCapacity < slot.capacity;
      })
      .map((slot) => {
        const { appointments, ...availableSlot } = slot;
        void appointments;

        return availableSlot;
      });
  }

  async create(createAvailabilityDto: CriarDisponibilidadeAgendaDto, user: AuthenticatedUser) {
    if (createAvailabilityDto.endDateTime <= createAvailabilityDto.startDateTime) {
      throw new BadRequestException('O horario final deve ser maior que o inicial');
    }

    this.ensureFutureAvailabilityDateTime(createAvailabilityDto.startDateTime);
    this.ensureAllowedAvailabilityDate(createAvailabilityDto.startDateTime);

    if (
      user.role === UserRole.EXTENSIONISTA &&
      createAvailabilityDto.extensionistId !== user.id
    ) {
      throw new BadRequestException('Extensionista so pode cadastrar a propria agenda');
    }

    const extensionist = await this.prisma.user.findFirst({
      where: {
        id: createAvailabilityDto.extensionistId,
        role: 'EXTENSIONISTA',
        isActive: true,
      },
      select: { id: true },
    });

    if (!extensionist) {
      throw new NotFoundException('Extensionista nao encontrado');
    }
    await this.ensureExtensionistMunicipality(createAvailabilityDto.extensionistId, createAvailabilityDto.municipalityId);

    await this.ensureNoOverlappingAvailability(
      createAvailabilityDto.extensionistId,
      createAvailabilityDto.startDateTime,
      createAvailabilityDto.endDateTime,
    );
    await this.ensureDailyAvailabilityLimit(createAvailabilityDto.extensionistId, [
      {
        startDateTime: createAvailabilityDto.startDateTime,
        endDateTime: createAvailabilityDto.endDateTime,
      },
    ]);

    const availability = await this.prisma.availability.create({
      data: createAvailabilityDto,
      include: {
        extensionist: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        municipality: {
          select: {
            id: true,
            name: true,
            state: true,
          },
        },
        _count: {
          select: {
            appointments: true,
          },
        },
      },
    });

    await this.createAuditLog(user.id, 'Availability', availability.id, 'CREATE', {
      startDateTime: availability.startDateTime.toISOString(),
      endDateTime: availability.endDateTime.toISOString(),
    });

    return availability;
  }

  async createWeekly(createWeeklyAvailabilityDto: CriarDisponibilidadeSemanalDto, user: AuthenticatedUser) {
    this.ensureCanManageExtensionist(createWeeklyAvailabilityDto.extensionistId, user);

    const extensionist = await this.findActiveExtensionist(createWeeklyAvailabilityDto.extensionistId);
    if (!extensionist) {
      throw new NotFoundException('Extensionista nao encontrado');
    }
    await this.ensureExtensionistMunicipality(
      createWeeklyAvailabilityDto.extensionistId,
      createWeeklyAvailabilityDto.municipalityId,
    );

    const weekStart = this.parseDateOnly(createWeeklyAvailabilityDto.weekStartDate);
    const uniqueWeekdays = Array.from(new Set(createWeeklyAvailabilityDto.weekdays)).sort();
    const timeBlocks = createWeeklyAvailabilityDto.timeBlocks?.length
      ? createWeeklyAvailabilityDto.timeBlocks
      : [
          {
            startTime: createWeeklyAvailabilityDto.startTime,
            endTime: createWeeklyAvailabilityDto.endTime,
            notes: createWeeklyAvailabilityDto.notes,
          },
        ];

    const data = timeBlocks.every((timeBlock) => timeBlock.date)
      ? timeBlocks.map((timeBlock) => this.buildAvailabilityDataFromTimeBlock(createWeeklyAvailabilityDto, timeBlock))
      : uniqueWeekdays.flatMap((weekday) =>
          timeBlocks.map((timeBlock) =>
            this.buildAvailabilityDataFromTimeBlock(createWeeklyAvailabilityDto, timeBlock, weekStart, weekday),
          ),
        );

    const blockedDate = data.find(
      (item) => !this.isAllowedAvailabilityDate(item.startDateTime) || !this.isFutureAvailabilityDateTime(item.startDateTime),
    );

    if (blockedDate) {
      throw new BadRequestException('Agenda so pode ser liberada em data futura, de segunda a sexta, exceto feriados');
    }

    const duplicateInRequest = data.find((item, index) =>
      data.some(
        (candidate, candidateIndex) =>
          candidateIndex !== index &&
          candidate.startDateTime < item.endDateTime &&
          candidate.endDateTime > item.startDateTime,
      ),
    );

    if (duplicateInRequest) {
      throw new BadRequestException('A agenda contem horarios repetidos ou sobrepostos');
    }

    const existingAvailability = await this.prisma.availability.findFirst({
      where: {
        extensionistId: createWeeklyAvailabilityDto.extensionistId,
        OR: data.map((item) => ({
          startDateTime: { lt: item.endDateTime },
          endDateTime: { gt: item.startDateTime },
        })),
      },
      select: { startDateTime: true },
    });

    if (existingAvailability) {
      throw new BadRequestException('Ja existe horario liberado para esse Extensionista');
    }

    await this.ensureDailyAvailabilityLimit(createWeeklyAvailabilityDto.extensionistId, data);

    await this.prisma.availability.createMany({ data });
    await this.createAuditLog(user.id, 'Availability', createWeeklyAvailabilityDto.extensionistId, 'CREATE', {
      generated: data.length,
      weekStartDate: createWeeklyAvailabilityDto.weekStartDate,
    });

    return this.prisma.availability.findMany({
      where: {
        extensionistId: createWeeklyAvailabilityDto.extensionistId,
        startDateTime: {
          in: data.map((item) => item.startDateTime),
        },
      },
      include: {
        extensionist: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        municipality: {
          select: {
            id: true,
            name: true,
            state: true,
          },
        },
        _count: {
          select: {
            appointments: true,
          },
        },
      },
      orderBy: {
        startDateTime: 'asc',
      },
    });
  }

  private buildAvailabilityDataFromTimeBlock(
    createWeeklyAvailabilityDto: CriarDisponibilidadeSemanalDto,
    timeBlock: { date?: string; startTime: string; endTime: string; notes?: string },
    weekStart?: Date,
    weekday?: number,
  ) {
    const startParts = this.parseTime(timeBlock.startTime);
    const endParts = this.parseTime(timeBlock.endTime);

    if (endParts.totalMinutes <= startParts.totalMinutes) {
      throw new BadRequestException('O horario final deve ser maior que o inicial');
    }

    const dateKey =
      timeBlock.date ??
      (weekStart !== undefined && weekday !== undefined
        ? this.getDateKeyForWeekday(weekStart, weekday)
        : createWeeklyAvailabilityDto.weekStartDate);

    return {
      extensionistId: createWeeklyAvailabilityDto.extensionistId,
      municipalityId: createWeeklyAvailabilityDto.municipalityId,
      startDateTime: this.buildCuiabaDateTime(dateKey, timeBlock.startTime),
      endDateTime: this.buildCuiabaDateTime(dateKey, timeBlock.endTime),
      capacity: createWeeklyAvailabilityDto.capacity,
      notes: timeBlock.notes ?? createWeeklyAvailabilityDto.notes,
    };
  }

  async update(id: string, updateAvailabilityDto: AtualizarDisponibilidadeAgendaDto, user: AuthenticatedUser) {
    const availability = await this.findAvailabilityForChange(id, user);

    if (
      updateAvailabilityDto.startDateTime &&
      updateAvailabilityDto.endDateTime &&
      updateAvailabilityDto.endDateTime <= updateAvailabilityDto.startDateTime
    ) {
      throw new BadRequestException('O horario final deve ser maior que o inicial');
    }

    const startDateTime = updateAvailabilityDto.startDateTime ?? availability.startDateTime;
    const endDateTime = updateAvailabilityDto.endDateTime ?? availability.endDateTime;

    if (endDateTime <= startDateTime) {
      throw new BadRequestException('O horario final deve ser maior que o inicial');
    }

    this.ensureFutureAvailabilityDateTime(startDateTime);
    this.ensureAllowedAvailabilityDate(startDateTime);

    if (updateAvailabilityDto.extensionistId) {
      this.ensureCanManageExtensionist(updateAvailabilityDto.extensionistId, user);

      const extensionist = await this.findActiveExtensionist(updateAvailabilityDto.extensionistId);
      if (!extensionist) {
        throw new NotFoundException('Extensionista nao encontrado');
      }
    }
    const nextMunicipalityId = updateAvailabilityDto.municipalityId ?? availability.municipalityId;

    if (!nextMunicipalityId) {
      throw new BadRequestException('Horario sem municipio definido nao pode ser alterado');
    }

    await this.ensureExtensionistMunicipality(updateAvailabilityDto.extensionistId ?? availability.extensionistId, nextMunicipalityId);

    await this.ensureNoOverlappingAvailability(
      updateAvailabilityDto.extensionistId ?? availability.extensionistId,
      startDateTime,
      endDateTime,
      id,
    );
    await this.ensureDailyAvailabilityLimit(
      updateAvailabilityDto.extensionistId ?? availability.extensionistId,
      [{ startDateTime, endDateTime }],
      id,
    );

    const updatedAvailability = await this.prisma.availability.update({
      where: { id },
      data: updateAvailabilityDto,
      include: {
        extensionist: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        municipality: {
          select: {
            id: true,
            name: true,
            state: true,
          },
        },
        _count: {
          select: {
            appointments: true,
          },
        },
      },
    });

    await this.createAuditLog(user.id, 'Availability', updatedAvailability.id, 'UPDATE', {
      startDateTime: updatedAvailability.startDateTime.toISOString(),
      endDateTime: updatedAvailability.endDateTime.toISOString(),
    });

    return updatedAvailability;
  }

  async remove(id: string, user: AuthenticatedUser) {
    const availability = await this.prisma.availability.findUnique({
      where: { id },
      include: {
        appointments: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!availability) {
      throw new NotFoundException('Horario nao encontrado');
    }

    this.ensureCanManageExtensionist(availability.extensionistId, user);

    if (availability.appointments.length > 0) {
      throw new BadRequestException('Horario com historico de atendimento nao pode ser excluido');
    }

    await this.prisma.availability.delete({ where: { id } });

    await this.createAuditLog(user.id, 'Availability', id, 'DELETE');

    return {
      id,
      deleted: true,
    };
  }

  private async findAvailabilityForChange(id: string, user: AuthenticatedUser) {
    const availability = await this.prisma.availability.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            appointments: true,
          },
        },
      },
    });

    if (!availability) {
      throw new NotFoundException('Horario nao encontrado');
    }

    this.ensureCanManageExtensionist(availability.extensionistId, user);

    if (availability._count.appointments > 0) {
      throw new BadRequestException('Horario com agendamento nao pode ser alterado ou excluido');
    }

    return availability;
  }

  private ensureCanManageExtensionist(extensionistId: string, user: AuthenticatedUser) {
    if (user.role === UserRole.ADMINISTRADOR) {
      return;
    }

    if (user.role === UserRole.EXTENSIONISTA && extensionistId === user.id) {
      return;
    }

    throw new ForbiddenException('Extensionista so pode gerenciar a propria agenda');
  }

  private async findActiveExtensionist(extensionistId: string) {
    return this.prisma.user.findFirst({
      where: {
        id: extensionistId,
        role: 'EXTENSIONISTA',
        isActive: true,
      },
      select: { id: true },
    });
  }

  private async ensureExtensionistMunicipality(extensionistId: string, municipalityId: string) {
    const link = await this.prisma.extensionistMunicipality.findUnique({
      where: {
        extensionistId_municipalityId: {
          extensionistId,
          municipalityId,
        },
      },
      select: { id: true },
    });

    if (!link) {
      throw new BadRequestException('Extensionista nao esta vinculado a este municipio');
    }
  }

  private async ensureNoOverlappingAvailability(
    extensionistId: string,
    startDateTime: Date,
    endDateTime: Date,
    ignoreAvailabilityId?: string,
  ) {
    const existingAvailability = await this.prisma.availability.findFirst({
      where: {
        extensionistId,
        startDateTime: { lt: endDateTime },
        endDateTime: { gt: startDateTime },
        id: ignoreAvailabilityId ? { not: ignoreAvailabilityId } : undefined,
      },
      select: { id: true },
    });

    if (existingAvailability) {
      throw new BadRequestException('Ja existe horario liberado para esse Extensionista');
    }
  }

  private async ensureDailyAvailabilityLimit(
    extensionistId: string,
    slots: Array<{ startDateTime: Date; endDateTime: Date }>,
    ignoreAvailabilityId?: string,
  ) {
    const maxSlotsPerDay = 4;
    const maxSlotsPerPeriod = 2;
    const slotsByDate = slots.reduce<Record<string, { total: number; morning: number; afternoon: number }>>((acc, slot) => {
      const dateKey = this.toDateKey(slot.startDateTime);
      const period = this.getAvailabilityPeriod(slot.startDateTime);
      const current = acc[dateKey] ?? { total: 0, morning: 0, afternoon: 0 };

      acc[dateKey] = {
        ...current,
        total: current.total + 1,
        [period]: current[period] + 1,
      };

      return acc;
    }, {});

    await Promise.all(
      Object.entries(slotsByDate).map(async ([dateKey, newSlotsCount]) => {
        const dayStart = this.buildCuiabaDateTime(dateKey, '00:00');
        const dayEnd = this.addDays(dayStart, 1);
        const existingSlots = await this.prisma.availability.findMany({
          where: {
            extensionistId,
            id: ignoreAvailabilityId ? { not: ignoreAvailabilityId } : undefined,
            startDateTime: {
              gte: dayStart,
              lt: dayEnd,
            },
          },
          select: {
            startDateTime: true,
          },
        });
        const existingSlotsCount = existingSlots.reduce(
          (acc, slot) => {
            const period = this.getAvailabilityPeriod(slot.startDateTime);

            return {
              ...acc,
              total: acc.total + 1,
              [period]: acc[period] + 1,
            };
          },
          { total: 0, morning: 0, afternoon: 0 },
        );

        if (existingSlotsCount.total + newSlotsCount.total > maxSlotsPerDay) {
          throw new BadRequestException('Ja existe horario liberado para esse Extensionista');
        }

        if (
          existingSlotsCount.morning + newSlotsCount.morning > maxSlotsPerPeriod ||
          existingSlotsCount.afternoon + newSlotsCount.afternoon > maxSlotsPerPeriod
        ) {
          throw new BadRequestException('Ja existe horario liberado para esse Extensionista');
        }
      }),
    );
  }

  private getAvailabilityPeriod(date: Date): 'morning' | 'afternoon' {
    const hours = date.getHours();

    return hours >= 6 && hours < 12 ? 'morning' : 'afternoon';
  }

  private parseDateOnly(value: string) {
    const date = new Date(`${value}T12:00:00-04:00`);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Data inicial da semana invalida');
    }

    return date;
  }

  private buildCuiabaDateTime(dateKey: string, time: string) {
    const date = new Date(`${dateKey}T${time}:00-04:00`);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Data ou horario invalido');
    }

    return date;
  }

  private getDateKeyForWeekday(weekStart: Date, weekday: number) {
    const day = new Date(weekStart);
    const offset = (weekday - weekStart.getDay() + 7) % 7;
    day.setDate(weekStart.getDate() + offset);

    return this.toDateKey(day);
  }

  private parseTime(value: string) {
    const [hoursRaw, minutesRaw] = value.split(':');
    const hours = Number(hoursRaw);
    const minutes = Number(minutesRaw);

    if (hours > 23 || minutes > 59) {
      throw new BadRequestException('Horario invalido');
    }

    return {
      hours,
      minutes,
      totalMinutes: hours * 60 + minutes,
    };
  }

  private ensureAllowedAvailabilityDate(date: Date) {
    if (!this.isAllowedAvailabilityDate(date)) {
      throw new BadRequestException('Agenda so pode ser liberada de segunda a sexta, exceto feriados');
    }
  }

  private ensureFutureAvailabilityDateTime(date: Date) {
    if (!this.isFutureAvailabilityDateTime(date)) {
      throw new BadRequestException('Agenda nao pode ser liberada em data ou horario passado');
    }
  }

  private isFutureAvailabilityDateTime(date: Date) {
    return date >= new Date();
  }

  private isAllowedAvailabilityDate(date: Date) {
    const weekday = date.getDay();

    return weekday >= 1 && weekday <= 5 && !this.isHoliday(date);
  }

  private isHoliday(date: Date) {
    return this.getBrazilHolidayKeys(date.getFullYear()).has(this.toDateKey(date));
  }

  private getBrazilHolidayKeys(year: number) {
    const easter = this.getEasterDate(year);
    const dates = [
      new Date(year, 0, 1),
      this.addDays(easter, -48),
      this.addDays(easter, -47),
      this.addDays(easter, -2),
      new Date(year, 3, 21),
      new Date(year, 4, 1),
      this.addDays(easter, 60),
      new Date(year, 8, 7),
      new Date(year, 9, 12),
      new Date(year, 10, 2),
      new Date(year, 10, 15),
      new Date(year, 10, 20),
      new Date(year, 11, 25),
    ];

    return new Set(dates.map((item) => this.toDateKey(item)));
  }

  private getEasterDate(year: number) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;

    return new Date(year, month - 1, day);
  }

  private addDays(date: Date, days: number) {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + days);

    return nextDate;
  }

  private toDateKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private async createAuditLog(
    userId: string,
    entity: string,
    entityId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'STATUS_CHANGE',
    payload?: Record<string, string | number>,
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
