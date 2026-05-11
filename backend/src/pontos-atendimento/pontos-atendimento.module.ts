import { Module } from '@nestjs/common';

import { PontosAtendimentoController } from './pontos-atendimento.controller';
import { PontosAtendimentoService } from './pontos-atendimento.service';

@Module({
  controllers: [PontosAtendimentoController],
  providers: [PontosAtendimentoService],
})
export class PontosAtendimentoModule {}
