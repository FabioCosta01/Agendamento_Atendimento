import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PrismaService } from '../../prisma/prisma.service';
import { SagaeMunicipiosService } from '../../sagae/sagae-municipios.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtService } from '../jwt.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly sagaeMunicipiosService: SagaeMunicipiosService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      this.logger.warn('Tentativa de acesso sem token Bearer');
      throw new UnauthorizedException('Token de autenticacao ausente ou invalido');
    }

    const token = authHeader.replace('Bearer ', '').trim();

    if (!token) {
      this.logger.warn('Token Bearer vazio');
      throw new UnauthorizedException('Token de autenticacao vazio');
    }

    try {
      const tokenUser = this.jwtService.verifyToken(token);

      // Validate user exists and is active
      const activeUser = await this.prisma.user.findFirst({
        where: {
          id: tokenUser.id,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          document: true,
          role: true,
          mustChangePassword: true,
          attendanceMunicipalities: {
            select: {
              municipalityId: true,
            },
          },
        },
      });

      if (!activeUser) {
        this.logger.warn('Usuario inativo ou nao encontrado');
        throw new UnauthorizedException('Usuario inativo ou nao encontrado');
      }
      const hydratedUser = await this.sagaeMunicipiosService.hydrateAttendanceMunicipality(activeUser);

      // Attach user to request object (without sensitive data)
      request.user = {
        id: activeUser.id,
        name: activeUser.name,
        email: activeUser.email,
        document: activeUser.document,
        role: activeUser.role,
        mustChangePassword: activeUser.mustChangePassword,
        attendanceMunicipalities: hydratedUser.attendanceMunicipalities,
      };

      return true;
    } catch (error) {
      // Log security events without exposing sensitive information
      if (error instanceof UnauthorizedException) {
        this.logger.warn(`Falha na autenticacao: ${error.message}`);
      } else {
        this.logger.error(`Erro inesperado na autenticacao: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }

      throw error;
    }
  }
}
