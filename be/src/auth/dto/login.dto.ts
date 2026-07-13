/**
 * Archivo: auth/dto/login.dto.ts.
 * Descripción: Valida el body de POST /api/v1/auth/login.
 * ¿Para qué? La contraseña solo valida que no esté vacía — la verificación del hash
 *   la realiza el service (evitar revelar reglas de contraseña en el login).
 */

import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'El email no tiene un formato válido.' })
  email!: string;

  @IsString()
  @MinLength(1, { message: 'La contraseña es requerida.' })
  password!: string;
}
