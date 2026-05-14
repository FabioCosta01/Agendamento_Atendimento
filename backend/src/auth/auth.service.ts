import { randomBytes } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from 'shared';

import { PrismaService } from '../prisma/prisma.service';
import { SagaeExtensionist, SagaeExtensionistasService } from '../sagae/sagae-extensionistas.service';
import { SagaeMunicipiosService } from '../sagae/sagae-municipios.service';
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
    private readonly sagaeMunicipiosService: SagaeMunicipiosService,
    private readonly sagaeExtensionistasService: SagaeExtensionistasService,
  ) {}

  async login(loginDto: LoginDto) {
    const identifier = loginDto.document.trim();
    this.ensureLoginAllowed(identifier);

    const documentDigits = identifier.replace(/\D/g, '');
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ document: documentDigits || identifier }, { email: identifier.toLowerCase() }],
        isActive: true,
      },
      include: {
        attendanceMunicipalities: {
          select: {
            municipalityId: true,
          },
        },
      },
    });
    const hasValidLocalPassword = user ? verifyPassword(loginDto.password, user.passwordHash) : false;

    if (user && hasValidLocalPassword) {
      this.clearFailedLogin(identifier);

      return this.buildLoginResponse(user, 'local');
    }

    if (this.isValidCpf(documentDigits)) {
      const sagaeLogin = await this.trySagaeExtensionistLogin(documentDigits, loginDto.password);

      if (sagaeLogin) {
        this.clearFailedLogin(identifier);
        return sagaeLogin;
      }

      if (user?.role === UserRole.EXTENSIONISTA) {
        this.registerFailedLogin(identifier);
        throw new UnauthorizedException('Documento ou senha invalidos');
      }
    }

    if (!hasValidLocalPassword) {
      this.registerFailedLogin(identifier);
      throw new UnauthorizedException('Documento ou senha invalidos');
    }

    this.clearFailedLogin(identifier);

    return this.buildLoginResponse(user!, 'local');
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
    if (trimmed.length < 6) {
      throw new BadRequestException('A nova senha deve ter no minimo 6 digitos.');
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

  private async trySagaeExtensionistLogin(document: string, password: string) {
    try {
      const extensionist = await this.sagaeExtensionistasService.authenticate(document, password);
      const user = await this.upsertSagaeExtensionist(extensionist);

      return this.buildLoginResponse(user, 'sagae');
    } catch (error) {
      if (
        error instanceof ServiceUnavailableException ||
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      if (error instanceof UnauthorizedException) {
        return null;
      }

      throw error;
    }
  }

  private async upsertSagaeExtensionist(extensionist: SagaeExtensionist) {
    const municipalityIds = await this.sagaeMunicipiosService.ensureMunicipalityIdsExist(extensionist.municipalityIds);
    const existingBySagaeId = extensionist.sagaeId
      ? await this.prisma.user.findFirst({
          where: { sagaeId: extensionist.sagaeId },
          select: { id: true, document: true },
        })
      : null;
    const existingByDocument = await this.prisma.user.findUnique({
      where: { document: extensionist.document },
      select: { id: true, sagaeId: true },
    });

    if (existingBySagaeId && existingByDocument && existingBySagaeId.id !== existingByDocument.id) {
      throw new ConflictException('Cadastro local inconsistente para este extensionista');
    }

    const existingUserId = existingBySagaeId?.id ?? existingByDocument?.id;
    const email = extensionist.email ?? `${extensionist.document}@sagae.local`;

    return this.prisma.user.upsert({
      where: { id: existingUserId ?? '__novo_extensionista_sagae__' },
      create: {
        sagaeId: extensionist.sagaeId,
        name: extensionist.name,
        email,
        document: extensionist.document,
        passwordHash: hashPassword(randomBytes(32).toString('base64url')),
        phone: extensionist.phone,
        role: UserRole.EXTENSIONISTA,
        isActive: true,
        mustChangePassword: false,
        attendanceMunicipalities: {
          create: municipalityIds.map((municipalityId) => ({ municipalityId })),
        },
      },
      update: {
        sagaeId: extensionist.sagaeId ?? undefined,
        name: extensionist.name,
        email,
        phone: extensionist.phone,
        role: UserRole.EXTENSIONISTA,
        isActive: true,
        mustChangePassword: false,
        attendanceMunicipalities: {
          deleteMany: {},
          create: municipalityIds.map((municipalityId) => ({ municipalityId })),
        },
      },
      include: {
        attendanceMunicipalities: {
          select: {
            municipalityId: true,
          },
        },
      },
    });
  }

  private async buildLoginResponse(
    user: {
      id: string;
      name: string;
      email: string;
      document: string;
      role: UserRole | string;
      mustChangePassword: boolean;
      attendanceMunicipalities?: Array<{ municipalityId: string }>;
    },
    source: 'local' | 'sagae',
  ) {
    const hydratedUser = await this.sagaeMunicipiosService.hydrateAttendanceMunicipality(user);

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        entity: 'User',
        entityId: user.id,
        action: 'LOGIN',
        payload: {
          source,
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
        attendanceMunicipalities: hydratedUser.attendanceMunicipalities,
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

  private isValidCpf(document: string) {
    if (!/^\d{11}$/.test(document) || /^(\d)\1{10}$/.test(document)) {
      return false;
    }

    const digits = document.split('').map(Number);
    const firstCheck = this.calculateCpfCheckDigit(digits.slice(0, 9), 10);
    const secondCheck = this.calculateCpfCheckDigit([...digits.slice(0, 9), firstCheck], 11);

    return digits[9] === firstCheck && digits[10] === secondCheck;
  }

  private calculateCpfCheckDigit(numbers: number[], weight: number) {
    const sum = numbers.reduce((total, number) => {
      const nextTotal = total + number * weight;
      weight -= 1;

      return nextTotal;
    }, 0);
    const remainder = (sum * 10) % 11;

    return remainder === 10 ? 0 : remainder;
  }
}
