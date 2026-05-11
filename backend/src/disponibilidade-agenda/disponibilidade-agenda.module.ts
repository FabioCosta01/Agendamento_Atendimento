import { Module } from '@nestjs/common';

import { DisponibilidadeAgendaController } from './disponibilidade-agenda.controller';
import { DisponibilidadeAgendaService } from './disponibilidade-agenda.service';

@Module({
  controllers: [DisponibilidadeAgendaController],
  providers: [DisponibilidadeAgendaService],
})
export class DisponibilidadeAgendaModule {}
