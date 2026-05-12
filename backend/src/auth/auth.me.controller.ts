import { Controller, Get } from '@nestjs/common';

import type { AuthenticatedUser } from './auth.types';
import { AllowPendingPasswordFlow } from './decorators/allow-pending-password.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthMeController {
  @AllowPendingPasswordFlow()
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}
