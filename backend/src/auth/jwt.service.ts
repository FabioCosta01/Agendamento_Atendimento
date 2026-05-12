import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';

import type { AuthenticatedUser } from './auth.types';

@Injectable()
export class JwtService {
  private readonly secret: string;
  private readonly expiresIn: string;
  private readonly issuer: string;

  constructor(private readonly configService: ConfigService) {
    this.secret = this.getSecret();
    this.expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '8h');
    this.issuer = this.configService.get<string>('JWT_ISSUER', 'agendamento-atendimento');
  }

  signToken(user: AuthenticatedUser): string {
    try {
      return jwt.sign(
        {
          ...user,
          iat: Math.floor(Date.now() / 1000), // Issued at time
        },
        this.secret,
        {
          expiresIn: this.expiresIn,
          issuer: this.issuer,
          audience: this.configService.get<string>('JWT_AUDIENCE', 'agendamento-atendimento-client'),
        } as jwt.SignOptions
      );
    } catch {
      throw new UnauthorizedException('Erro ao gerar token JWT');
    }
  }

  verifyToken(token: string): AuthenticatedUser {
    try {
      if (!token || typeof token !== 'string') {
        throw new UnauthorizedException('Token invalido');
      }

      const decoded = jwt.verify(token, this.secret, {
        algorithms: ['HS256'],
        issuer: this.issuer,
        audience: this.configService.get<string>('JWT_AUDIENCE', 'agendamento-atendimento-client'),
        clockTolerance: 30, // 30 seconds tolerance for clock skew
      }) as AuthenticatedUser & { iat: number; exp: number };

      // Additional validation
      if (!decoded.id || !decoded.role) {
        throw new UnauthorizedException('Token com dados invalidos');
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Token expirado');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException('Token invalido');
      }
      if (error instanceof jwt.NotBeforeError) {
        throw new UnauthorizedException('Token ainda nao valido');
      }
      throw new UnauthorizedException('Erro na validacao do token');
    }
  }

  private getSecret(): string {
    const secret = this.configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new Error('JWT_SECRET nao configurado - aplicacao nao pode iniciar');
    }

    if (secret === 'trocar-por-um-segredo-seguro') {
      throw new Error('JWT_SECRET usa valor padrao inseguro - aplicacao nao pode iniciar');
    }

    if (secret.length < 32) {
      throw new Error('JWT_SECRET muito curto - aplicacao nao pode iniciar');
    }

    return secret;
  }
}
