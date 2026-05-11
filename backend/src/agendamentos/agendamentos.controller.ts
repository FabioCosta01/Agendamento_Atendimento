import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { UserRole } from 'shared';

import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

import { AgendamentosService } from './agendamentos.service';
import { AtualizarStatusAgendamentoDto } from './dto/atualizar-status-agendamento.dto';
import { CriarAgendamentoDto } from './dto/criar-agendamento.dto';
import { ReagendarAgendamentoDto } from './dto/reagendar-agendamento.dto';

@Controller('agendamentos')
export class AgendamentosController {
  constructor(private readonly appointmentsService: AgendamentosService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.appointmentsService.findAll(user);
  }

  @Post()
  create(
    @Body() createAppointmentDto: CriarAgendamentoDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.appointmentsService.create(createAppointmentDto, user);
  }

  @Patch(':protocolCode/status')
  @Roles(UserRole.EXTENSIONISTA, UserRole.ADMINISTRADOR)
  updateStatus(
    @Param('protocolCode') protocolCode: string,
    @Body() updateStatusDto: AtualizarStatusAgendamentoDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.appointmentsService.updateStatus(protocolCode, updateStatusDto, user);
  }

  @Patch(':protocolCode/reagendar')
  @Roles(UserRole.EXTENSIONISTA, UserRole.ADMINISTRADOR)
  reschedule(
    @Param('protocolCode') protocolCode: string,
    @Body() rescheduleAppointmentDto: ReagendarAgendamentoDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.appointmentsService.reschedule(protocolCode, rescheduleAppointmentDto, user);
  }
}
