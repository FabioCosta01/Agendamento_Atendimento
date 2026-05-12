import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from 'shared';

import { PrismaService } from '../prisma/prisma.service';
import { hashPassword, verifyPassword } from '../security/password';
import { generateProvisionalPassword } from '../security/provisional-password';

import { LoginDto } from './dto/login.dto';
import { JwtService } from './jwt.service';

@Injectable()
export class AuthService {
  private readonly failedAttempts = new Map<string, { count: number; blockedUntil?: number; firstAttemptAt: number }>();
  private readonly recoveryAttempts = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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
        mustChangePassword: user.mustChangePassword,
        attendanceMunicipalities: user.attendanceMunicipalities,
      },
      token: this.jwtService.signToken({
        id: user.id,
        name: user.name,
        email: user.email,
        document: user.document,
        role: user.role as UserRole,
        mustChangePassword: user.mustChangePassword,
      }),
      tokenType: 'Bearer',
      requiresTwoFactor: false,
    };
  }

  private readonly genericRecoveryMessage =
    'Nao foi possivel concluir a solicitacao com os dados informados. Verifique CPF e telefone cadastrados.';

  async recoverPassword(document: string, phone: string, clientIp: string) {
    this.registerRecoveryAttempt(clientIp);

    const phoneDigits = phone.replace(/\D/g, '');
    const documentDigits = document.replace(/\D/g, '');

    const user = await this.prisma.user.findFirst({
      where: {
        document: documentDigits,
        isActive: true,
      },
      select: {
        id: true,
        phone: true,
      },
    });

    const storedPhone = (user?.phone ?? '').replace(/\D/g, '');
    if (!user || storedPhone !== phoneDigits) {
      throw new BadRequestException(this.genericRecoveryMessage);
    }

    const provisional = generateProvisionalPassword();

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashPassword(provisional),
        mustChangePassword: true,
      },
    });

    await this.prisma.auditLog
      .create({
        data: {
          userId: user.id,
          entity: 'User',
          entityId: user.id,
          action: 'PASSWORD_RESET',
          payload: { method: 'phone_match' },
        },
      })
      .catch(() => undefined);

    const response: { message: string; provisionalPassword?: string } = {
      message:
        this.configService.get<string>('NODE_ENV', 'development') === 'production'
          ? 'Senha provisoria gerada. Procure o canal oficial de atendimento para recebe-la com seguranca.'
          : 'Senha provisoria gerada. Anote-a com seguranca. No proximo acesso sera obrigatorio definir uma nova senha.',
    };

    if (this.configService.get<string>('NODE_ENV', 'development') !== 'production') {
      response.provisionalPassword = provisional;
    }

    return response;
  }

  async completeMandatoryPasswordChange(userId: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { mustChangePassword: true, document: true },
    });

    if (!user?.mustChangePassword) {
      throw new BadRequestException('Nao ha troca de senha obrigatoria pendente.');
    }

    const trimmed = newPassword.trim();
    if (trimmed.length < 8) {
      throw new BadRequestException('A nova senha deve ter pelo menos 8 caracteres.');
    }
    if (trimmed.replace(/\D/g, '') === user.document || trimmed === '12345678') {
      throw new BadRequestException('Use uma senha diferente do CPF e de senhas muito comuns.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashPassword(trimmed),
        mustChangePassword: false,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        entity: 'User',
        entityId: userId,
        action: 'UPDATE',
        payload: { mandatoryPasswordChangeCompleted: true },
      },
    });

    return { message: 'Senha atualizada com sucesso.' };
  }

  private registerRecoveryAttempt(clientIp: string) {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const max = 5;
    let entry = this.recoveryAttempts.get(clientIp);

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
    }

    if (entry.count >= max) {
      throw new HttpException('Muitas tentativas. Tente novamente mais tarde.', HttpStatus.TOO_MANY_REQUESTS);
    }

    entry.count += 1;
    this.recoveryAttempts.set(clientIp, entry);
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
