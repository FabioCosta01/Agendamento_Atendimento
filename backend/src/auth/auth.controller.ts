import { BadRequestException, Body, Controller, Post } from '@nestjs/common';

import { AuthService } from './auth.service';
import type { AuthenticatedUser } from './auth.types';
import { AllowPendingPasswordFlow } from './decorators/allow-pending-password.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { TrocarSenhaObrigatoriaDto } from './dto/trocar-senha-obrigatoria.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('recuperar-senha')
  recuperarSenha() {
    throw new BadRequestException('Funcionalidade em desenvolvimento');
  }

  @AllowPendingPasswordFlow()
  @Post('trocar-senha-obrigatoria')
  trocarSenhaObrigatoria(@CurrentUser() user: AuthenticatedUser, @Body() dto: TrocarSenhaObrigatoriaDto) {
    return this.authService.completeMandatoryPasswordChange(user.id, dto.newPassword);
  }
}
