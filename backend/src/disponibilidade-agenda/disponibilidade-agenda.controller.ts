import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { UserRole } from 'shared';

import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

import { DisponibilidadeAgendaService } from './disponibilidade-agenda.service';
import { AtualizarDisponibilidadeAgendaDto } from './dto/atualizar-disponibilidade-agenda.dto';
import { CriarDisponibilidadeAgendaDto } from './dto/criar-disponibilidade-agenda.dto';
import { CriarDisponibilidadeSemanalDto } from './dto/criar-disponibilidade-semanal.dto';

@Controller('disponibilidade-agenda')
export class DisponibilidadeAgendaController {
  constructor(private readonly availabilityService: DisponibilidadeAgendaService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.availabilityService.findAll(user);
  }

  @Roles(UserRole.EXTENSIONISTA, UserRole.ADMINISTRADOR)
  @Post()
  create(
    @Body() createAvailabilityDto: CriarDisponibilidadeAgendaDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.availabilityService.create(createAvailabilityDto, user);
  }

  @Roles(UserRole.EXTENSIONISTA, UserRole.ADMINISTRADOR)
  @Post('semanal')
  createWeekly(
    @Body() createWeeklyAvailabilityDto: CriarDisponibilidadeSemanalDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.availabilityService.createWeekly(createWeeklyAvailabilityDto, user);
  }

  @Roles(UserRole.EXTENSIONISTA, UserRole.ADMINISTRADOR)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAvailabilityDto: AtualizarDisponibilidadeAgendaDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.availabilityService.update(id, updateAvailabilityDto, user);
  }

  @Roles(UserRole.EXTENSIONISTA, UserRole.ADMINISTRADOR)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.availabilityService.remove(id, user);
  }

  @Roles(UserRole.EXTENSIONISTA, UserRole.ADMINISTRADOR)
  @Post(':id/excluir')
  removeByPost(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.availabilityService.remove(id, user);
  }
}
