import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { AuthenticatedUser } from '../auth.types';
import { ALLOW_PENDING_PASSWORD_KEY } from '../decorators/allow-pending-password.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class MustChangePasswordGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      return true;
    }

    const allowPending = this.reflector.getAllAndOverride<boolean>(ALLOW_PENDING_PASSWORD_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (allowPending) {
      return true;
    }

    if (user.mustChangePassword) {
      throw new ForbiddenException('E necessario alterar sua senha antes de continuar.');
    }

    return true;
  }
}
