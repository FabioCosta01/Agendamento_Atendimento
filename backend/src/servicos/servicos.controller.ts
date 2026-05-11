import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { UserRole } from 'shared';

import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

import { AtualizarServicoDto } from './dto/atualizar-servico.dto';
import { CriarServicoDto } from './dto/criar-servico.dto';
import { ServicosService } from './servicos.service';

@Controller('servicos')
export class ServicosController {
  constructor(private readonly servicesService: ServicosService) {}

  @Get()
  findAll() {
    return this.servicesService.findAll();
  }

  @Roles(UserRole.ADMINISTRADOR)
  @Post()
  create(@Body() createServiceDto: CriarServicoDto, @CurrentUser() user: AuthenticatedUser) {
    return this.servicesService.create(createServiceDto, user);
  }

  @Roles(UserRole.ADMINISTRADOR)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateServiceDto: AtualizarServicoDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.servicesService.update(id, updateServiceDto, user);
  }
}
