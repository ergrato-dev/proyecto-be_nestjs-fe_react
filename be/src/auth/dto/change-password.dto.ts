/**
 * Archivo: auth/dto/change-password.dto.ts.
 * Descripción: Valida el body de POST /api/v1/auth/change-password.
 * ¿Para qué? Rechazar cambios inútiles (misma contraseña) y garantizar la fortaleza mínima.
 * ¿Impacto? @IsDifferentFrom aplica una validación cruzada — no basta con validar cada
 *   campo por separado, se necesita comparar ambos valores juntos.
 */

import { IsString, Matches, MinLength } from 'class-validator';
import { PASSWORD_MESSAGE, PASSWORD_REGEX } from '../constants/password-policy';
import { IsDifferentFrom } from '../validators/is-different-from.validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(1, { message: 'La contraseña actual es requerida.' })
  currentPassword!: string;

  @IsString()
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  @IsDifferentFrom('currentPassword')
  newPassword!: string;
}
