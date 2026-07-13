/**
 * Archivo: users/dto/update-locale.dto.ts.
 * Descripción: Valida el body de PATCH /api/v1/users/me/locale.
 * ¿Para qué? Solo admite 'es' y 'en' — los dos idiomas soportados por el sistema.
 * ¿Impacto? Evita almacenar locales inválidos que romperían la lógica de i18n en el FE.
 */

import { IsIn } from 'class-validator';

export type Locale = 'es' | 'en';

export class UpdateLocaleDto {
  @IsIn(['es', 'en'], { message: "El idioma debe ser 'es' o 'en'." })
  locale!: Locale;
}
