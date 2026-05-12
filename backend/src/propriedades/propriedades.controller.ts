import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';

import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { CriarPropriedadeDto } from './dto/criar-propriedade.dto';
import { PropriedadesService } from './propriedades.service';

@Controller('propriedades')
export class PropriedadesController {
  constructor(private readonly propertiesService: PropriedadesService) {}

  @Get()
  findAll(@Query('ownerId') ownerId: string | undefined, @CurrentUser() user: AuthenticatedUser) {
    return this.propertiesService.findAll(user, ownerId);
  }

  @Post()
  create(
    @Body() createPropertyDto: CriarPropriedadeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.propertiesService.create(createPropertyDto, user);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.propertiesService.delete(id, user);
  }
}
