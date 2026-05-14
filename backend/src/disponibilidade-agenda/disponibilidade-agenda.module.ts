import { Module } from '@nestjs/common';

import { SagaeModule } from '../sagae/sagae.module';

import { DisponibilidadeAgendaController } from './disponibilidade-agenda.controller';
import { DisponibilidadeAgendaService } from './disponibilidade-agenda.service';

@Module({
  imports: [SagaeModule],
  controllers: [DisponibilidadeAgendaController],
  providers: [DisponibilidadeAgendaService],
})
export class DisponibilidadeAgendaModule {}
