/**
 * Archivo: auth/auth.module.ts.
 * Descripción: Módulo de autenticación — agrupa controller, service, estrategia JWT
 *   y las entidades TypeORM que le pertenecen (tokens de verificación/reset).
 * ¿Para qué? Encapsular todo el dominio de auth; otros módulos solo dependen de lo
 *   que este módulo exporta explícitamente (JwtModule, PassportModule).
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from '../mail/mail.module';
import { User } from '../users/entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailVerificationToken } from './entities/email-verification-token.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      EmailVerificationToken,
      PasswordResetToken,
    ]),
    PassportModule,
    // ¿Qué? Sin secreto/expiración por defecto — access y refresh usan secretos distintos,
    //   pasados explícitamente en cada llamada a sign()/verifyAsync() en AuthService.
    JwtModule.register({}),
    MailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
