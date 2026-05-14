import { Module } from '@nestjs/common';

import { NotificacoesModule } from '../notificacoes/notificacoes.module';
import { SagaeModule } from '../sagae/sagae.module';

import { AgendamentosController } from './agendamentos.controller';
import { AgendamentosService } from './agendamentos.service';

@Module({
  imports: [NotificacoesModule, SagaeModule],
  controllers: [AgendamentosController],
  providers: [AgendamentosService],
})
export class AgendamentosModule {}
