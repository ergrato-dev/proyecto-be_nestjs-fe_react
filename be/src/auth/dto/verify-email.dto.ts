/**
 * Archivo: auth/dto/verify-email.dto.ts.
 * Descripción: Valida el body de POST /api/v1/auth/verify-email.
 * ¿Para qué? Asegurar que el campo token esté presente antes de buscarlo en la BD.
 * ¿Impacto? Sin validación previa, un body vacío causaría una búsqueda innecesaria en BD.
 */

import { IsString, MinLength } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  @MinLength(1, { message: 'El token de verificación es requerido.' })
  token!: string;
}
