import { Controller, Get } from '@nestjs/common';

import type { AuthenticatedUser } from './auth.types';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthMeController {
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}
