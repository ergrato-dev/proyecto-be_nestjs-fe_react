/**
 * Archivo: auth/auth.controller.ts.
 * Descripción: Handlers HTTP para los endpoints de autenticación bajo /api/v1/auth.
 * ¿Para qué? Capa delgada que extrae datos del request, llama al service y formatea
 *   el response — no contiene lógica de negocio.
 * ¿Impacto? El envelope { success, data } / { success, message } es el contrato que
 *   el frontend React ya consume — no puede cambiar.
 */

import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

// ¿Qué? Rate limit de 10 req / 15 min — aplicado a login, register y verify-email.
const AUTH_THROTTLE = { default: { limit: 10, ttl: 15 * 60 * 1000 } };
// ¿Qué? Rate limit más estricto (5 req / 15 min) para forgot-password — previene
//   abuso del envío masivo de emails.
const FORGOT_PASSWORD_THROTTLE = { default: { limit: 5, ttl: 15 * 60 * 1000 } };

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ¿Qué? Registra un nuevo usuario. Envía email de verificación automáticamente.
  @Throttle(AUTH_THROTTLE)
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    const user = await this.authService.register(dto);
    return { success: true, data: user };
  }

  // ¿Qué? Inicia sesión y entrega access + refresh token.
  // ¿Para qué? La IP del cliente se pasa al service para el audit log de seguridad.
  @Throttle(AUTH_THROTTLE)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Ip() ip: string) {
    const tokens = await this.authService.login(dto, ip);
    return { success: true, data: tokens };
  }

  // ¿Qué? Renueva el par de tokens (access + refresh) — rotación de tokens.
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    const tokens = await this.authService.refreshTokens(dto);
    return { success: true, data: tokens };
  }

  // ¿Qué? Cambia la contraseña del usuario autenticado.
  // ¿Para qué? El userId se toma del token JWT (@CurrentUser) — nunca del body.
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(user.id, dto);
    return { success: true, message: 'Contraseña actualizada correctamente.' };
  }

  // ¿Qué? Inicia el flujo de recuperación enviando el email con el token.
  // ¿Para qué? Siempre responde 200 para no revelar si el email existe (OWASP A07).
  @Throttle(FORGOT_PASSWORD_THROTTLE)
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.requestPasswordReset(dto);
    return {
      success: true,
      message:
        'Si el email existe recibirás un enlace de recuperación en breve.',
    };
  }

  // ¿Qué? Restablece la contraseña usando el token de recuperación.
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto);
    return { success: true, message: 'Contraseña restablecida correctamente.' };
  }

  // ¿Qué? Verifica el email del usuario usando el token del enlace de activación.
  // ¿Impacto? Hasta que este endpoint sea llamado con un token válido, el login retorna 403.
  @Throttle(AUTH_THROTTLE)
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.authService.verifyEmail(dto);
    return {
      success: true,
      message: 'Email verificado correctamente. Ya puedes iniciar sesión.',
    };
  }
}
