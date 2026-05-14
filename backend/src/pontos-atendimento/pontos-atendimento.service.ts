import { Injectable } from '@nestjs/common';

import { SagaeMunicipiosService } from '../sagae/sagae-municipios.service';

@Injectable()
export class PontosAtendimentoService {
  constructor(private readonly sagaeMunicipiosService: SagaeMunicipiosService) {}

  async findAll() {
    return this.sagaeMunicipiosService.findAll();
  }
}
