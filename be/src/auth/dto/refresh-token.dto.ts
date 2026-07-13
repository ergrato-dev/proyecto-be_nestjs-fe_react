/**
 * Archivo: auth/dto/refresh-token.dto.ts.
 * Descripción: Valida el body de POST /api/v1/auth/refresh.
 * ¿Para qué? Evitar que el endpoint reciba un body vacío antes de intentar verificar el JWT.
 */

import { IsString, MinLength } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @MinLength(1, { message: 'El refresh token es requerido.' })
  refreshToken!: string;
}
