/**
 * Archivo: auth/dto/forgot-password.dto.ts.
 * Descripción: Valida el body de POST /api/v1/auth/forgot-password.
 * ¿Para qué? Rechazar emails malformados antes de consultar la BD.
 * ¿Impacto? El service siempre responde 200 independientemente de si el email existe —
 *   este DTO solo valida el formato, no la existencia del usuario.
 */

import { Transform } from 'class-transformer';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'El email no tiene un formato válido.' })
  email!: string;
}
