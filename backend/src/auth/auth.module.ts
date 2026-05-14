import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { PrismaModule } from '../prisma/prisma.module';
import { SagaeModule } from '../sagae/sagae.module';

import { AuthController } from './auth.controller';
import { AuthMeController } from './auth.me.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { MustChangePasswordGuard } from './guards/must-change-password.guard';
import { RolesGuard } from './guards/roles.guard';
import { JwtService } from './jwt.service';

@Module({
  imports: [PrismaModule, SagaeModule],
  controllers: [AuthController, AuthMeController],
  providers: [
    AuthService,
    JwtService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: MustChangePasswordGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [JwtService],
})
export class AuthModule {}
