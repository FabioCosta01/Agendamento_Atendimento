import { Module } from '@nestjs/common';

import { SagaeModule } from '../sagae/sagae.module';

import { PontosAtendimentoController } from './pontos-atendimento.controller';
import { PontosAtendimentoService } from './pontos-atendimento.service';

@Module({
  imports: [SagaeModule],
  controllers: [PontosAtendimentoController],
  providers: [PontosAtendimentoService],
})
export class PontosAtendimentoModule {}
