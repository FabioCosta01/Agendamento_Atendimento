import { Module } from '@nestjs/common';

import { SagaeModule } from '../sagae/sagae.module';

import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';

@Module({
  imports: [SagaeModule],
  controllers: [UsuariosController],
  providers: [UsuariosService],
})
export class UsuariosModule {}
