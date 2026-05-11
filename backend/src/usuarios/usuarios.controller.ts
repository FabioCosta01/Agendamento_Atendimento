import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { UserRole } from 'shared';

import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

import { AtualizarUsuarioDto } from './dto/atualizar-usuario.dto';
import { CadastrarSolicitanteDto } from './dto/cadastrar-solicitante.dto';
import { CriarUsuarioDto } from './dto/criar-usuario.dto';
import { UsuariosService } from './usuarios.service';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usersService: UsuariosService) {}

  @Public()
  @Post('cadastrar-solicitante')
  registerRequester(@Body() registerRequesterDto: CadastrarSolicitanteDto) {
    return this.usersService.registerRequester(registerRequesterDto);
  }

  @Roles(UserRole.EXTENSIONISTA, UserRole.ADMINISTRADOR)
  @Get('solicitantes')
  findRequesters() {
    return this.usersService.findRequesters();
  }

  @Roles(UserRole.ADMINISTRADOR)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Roles(UserRole.ADMINISTRADOR)
  @Post()
  create(@Body() createUserDto: CriarUsuarioDto, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.create(createUserDto, user);
  }

  @Roles(UserRole.ADMINISTRADOR)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: AtualizarUsuarioDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.update(id, updateUserDto, user);
  }
}
