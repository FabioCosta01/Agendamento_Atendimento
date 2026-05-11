import { Controller, Get } from '@nestjs/common';
import { UserRole } from 'shared';

import { Roles } from '../auth/decorators/roles.decorator';

import { PontosAtendimentoService } from './pontos-atendimento.service';

@Controller('pontos-atendimento')
export class PontosAtendimentoController {
  constructor(private readonly pontosAtendimentoService: PontosAtendimentoService) {}

  @Roles(UserRole.EXTENSIONISTA, UserRole.ADMINISTRADOR)
  @Get()
  findAll() {
    return this.pontosAtendimentoService.findAll();
  }
}
