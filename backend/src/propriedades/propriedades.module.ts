import { Module } from '@nestjs/common';

import { PropriedadesController } from './propriedades.controller';
import { PropriedadesService } from './propriedades.service';

@Module({
  controllers: [PropriedadesController],
  providers: [PropriedadesService],
})
export class PropriedadesModule {}
