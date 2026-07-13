/**
 * Archivo: auth/dto/reset-password.dto.ts.
 * Descripción: Valida el body de POST /api/v1/auth/reset-password.
 * ¿Para qué? Rechazar tokens vacíos y contraseñas débiles antes de consultar la BD.
 * ¿Impacto? La verificación de que el token existe, no expiró y no fue usado es
 *   responsabilidad del service — este DTO solo valida el formato del body.
 */

import { IsString, Matches, MinLength } from 'class-validator';
import { PASSWORD_MESSAGE, PASSWORD_REGEX } from '../constants/password-policy';

export class ResetPasswordDto {
  @IsString()
  @MinLength(1, { message: 'El token es requerido.' })
  token!: string;

  @IsString()
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  newPassword!: string;
}
