import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  healthCheck() {
    return {
      status: 'ok',
      service: 'agendamento-atendimento-api',
      timestamp: new Date().toISOString(),
    };
  }
}
