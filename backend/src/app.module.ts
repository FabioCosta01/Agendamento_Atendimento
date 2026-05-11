import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AgendamentosModule } from './agendamentos/agendamentos.module';
import { validateEnvironment } from './app.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DisponibilidadeAgendaModule } from './disponibilidade-agenda/disponibilidade-agenda.module';
import { NotificacoesModule } from './notificacoes/notificacoes.module';
import { PontosAtendimentoModule } from './pontos-atendimento/pontos-atendimento.module';
import { PrismaModule } from './prisma/prisma.module';
import { PropriedadesModule } from './propriedades/propriedades.module';
import { ServicosModule } from './servicos/servicos.module';
import { UsuariosModule } from './usuarios/usuarios.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    PrismaModule,
    AuthModule,
    UsuariosModule,
    ServicosModule,
    PropriedadesModule,
    DisponibilidadeAgendaModule,
    NotificacoesModule,
    PontosAtendimentoModule,
    AgendamentosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
