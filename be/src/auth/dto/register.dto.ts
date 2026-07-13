/**
 * Archivo: auth/dto/register.dto.ts.
 * Descripción: Valida el body de POST /api/v1/auth/register.
 * ¿Para qué? Rechazar en el servidor cualquier dato malformado antes de consultar la BD.
 * ¿Impacto? El Transform normaliza el email (trim + lowercase) para evitar duplicados
 *   por diferencias de mayúsculas/espacios.
 */

import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, Matches } from 'class-validator';
import { PASSWORD_MESSAGE, PASSWORD_REGEX } from '../constants/password-policy';

export class RegisterDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'El email no tiene un formato válido.' })
  email!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(2, 100, {
    message: 'El nombre completo debe tener entre 2 y 100 caracteres.',
  })
  fullName!: string;

  @IsString()
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  password!: string;
}
