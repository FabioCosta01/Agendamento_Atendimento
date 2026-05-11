import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';

import type { AuthenticatedUser } from './auth.types';

@Injectable()
export class JwtService {
  constructor(private readonly configService: ConfigService) {}

  signToken(user: AuthenticatedUser) {
    const secret = this.getSecret();

    return jwt.sign(user, secret, {
      algorithm: 'HS256',
      expiresIn: '8h',
      issuer: 'agendamento-atendimento',
    });
  }

  verifyToken(token: string): AuthenticatedUser {
    try {
      const secret = this.getSecret();
      return jwt.verify(token, secret, {
        algorithms: ['HS256'],
        issuer: 'agendamento-atendimento',
      }) as AuthenticatedUser;
    } catch {
      throw new UnauthorizedException('Token invalido ou expirado');
    }
  }

  private getSecret() {
    const secret = this.configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new UnauthorizedException('JWT_SECRET nao configurado');
    }

    return secret;
  }
}
