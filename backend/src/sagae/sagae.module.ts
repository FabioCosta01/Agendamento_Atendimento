import { Module } from '@nestjs/common';

import { SagaeExtensionistasService } from './sagae-extensionistas.service';
import { SagaeMunicipiosService } from './sagae-municipios.service';

@Module({
  providers: [SagaeExtensionistasService, SagaeMunicipiosService],
  exports: [SagaeExtensionistasService, SagaeMunicipiosService],
})
export class SagaeModule {}
