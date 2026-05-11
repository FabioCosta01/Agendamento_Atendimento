import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PrismaService } from '../../prisma/prisma.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtService } from '../jwt.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
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
      throw new UnauthorizedException('Token ausente');
    }

    const token = authHeader.replace('Bearer ', '').trim();
    const tokenUser = this.jwtService.verifyToken(token);
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

    if (!activeUser) {
      throw new UnauthorizedException('Usuario inativo ou nao encontrado');
    }

    request.user = activeUser;
    return true;
  }
}
