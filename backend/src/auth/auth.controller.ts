import { Body, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';

import { getClientIp } from '../common/request-ip';

import { AuthService } from './auth.service';
import type { AuthenticatedUser } from './auth.types';
import { AllowPendingPasswordFlow } from './decorators/allow-pending-password.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { RecuperarSenhaDto } from './dto/recuperar-senha.dto';
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
  recuperarSenha(@Body() dto: RecuperarSenhaDto, @Req() req: Request) {
    return this.authService.recoverPassword(dto.document, dto.phone, getClientIp(req));
  }

  @AllowPendingPasswordFlow()
  @Post('trocar-senha-obrigatoria')
  trocarSenhaObrigatoria(@CurrentUser() user: AuthenticatedUser, @Body() dto: TrocarSenhaObrigatoriaDto) {
    return this.authService.completeMandatoryPasswordChange(user.id, dto.newPassword);
  }
}
