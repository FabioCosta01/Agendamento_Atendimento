import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRole } from 'shared';

import { PrismaService } from '../prisma/prisma.service';
import { verifyPassword } from '../security/password';

import { LoginDto } from './dto/login.dto';
import { JwtService } from './jwt.service';

@Injectable()
export class AuthService {
  private readonly failedAttempts = new Map<string, { count: number; blockedUntil?: number; firstAttemptAt: number }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    this.ensureLoginAllowed(loginDto.document);

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ document: loginDto.document }, { email: loginDto.document }],
        isActive: true,
      },
      include: {
        attendanceMunicipalities: {
          select: {
            municipality: {
              select: {
                id: true,
                name: true,
                state: true,
              },
            },
          },
        },
      },
    });

    if (!user || !verifyPassword(loginDto.password, user.passwordHash)) {
      this.registerFailedLogin(loginDto.document);
      throw new UnauthorizedException('Documento ou senha invalidos');
    }

    this.clearFailedLogin(loginDto.document);

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        entity: 'User',
        entityId: user.id,
        action: 'LOGIN',
        payload: {
          at: new Date().toISOString(),
        },
      },
    });

    return {
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        document: user.document,
        role: user.role,
        attendanceMunicipalities: user.attendanceMunicipalities,
      },
      token: this.jwtService.signToken({
        id: user.id,
        name: user.name,
        email: user.email,
        document: user.document,
        role: user.role as UserRole,
      }),
      tokenType: 'Bearer',
      requiresTwoFactor: false,
    };
  }

  private ensureLoginAllowed(identifier: string) {
    const key = this.normalizeIdentifier(identifier);
    const attempt = this.failedAttempts.get(key);

    if (attempt?.blockedUntil && attempt.blockedUntil > Date.now()) {
      throw new HttpException('Muitas tentativas. Tente novamente em alguns minutos.', HttpStatus.TOO_MANY_REQUESTS);
    }

    if (attempt?.blockedUntil && attempt.blockedUntil <= Date.now()) {
      this.failedAttempts.delete(key);
    }
  }

  private registerFailedLogin(identifier: string) {
    const key = this.normalizeIdentifier(identifier);
    const now = Date.now();
    const windowMs = 10 * 60 * 1000;
    const blockMs = 5 * 60 * 1000;
    const current = this.failedAttempts.get(key);
    const next =
      current && now - current.firstAttemptAt <= windowMs
        ? { ...current, count: current.count + 1 }
        : { count: 1, firstAttemptAt: now };

    if (next.count >= 5) {
      next.blockedUntil = now + blockMs;
    }

    this.failedAttempts.set(key, next);
  }

  private clearFailedLogin(identifier: string) {
    this.failedAttempts.delete(this.normalizeIdentifier(identifier));
  }

  private normalizeIdentifier(identifier: string) {
    return identifier.trim().toLowerCase();
  }
}
