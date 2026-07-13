/**
 * Archivo: config/env.validation.ts.
 * Descripción: Schema Joi que valida todas las variables de entorno al arrancar la app.
 * ¿Para qué? Garantizar que la aplicación no arranque con configuración incompleta o inválida
 *   (fail-fast) — @nestjs/config ejecuta este schema una sola vez durante el bootstrap.
 * ¿Impacto? Si falta una variable crítica (ej: JWT_ACCESS_SECRET), Nest lanza una excepción
 *   clara al iniciar en vez de fallar silenciosamente en medio de una request de producción.
 */

import * as Joi from 'joi';

// ¿Qué? Reglas de validación para cada variable de entorno esperada por la app.
// ¿Para qué? Los secretos JWT exigen mínimo 32 caracteres — un secreto corto sería
//   vulnerable a fuerza bruta sobre la firma HS256.
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  MAIL_HOST: Joi.string().default('localhost'),
  MAIL_PORT: Joi.number().default(1025),
  MAIL_FROM: Joi.string()
    .email({ tlds: false })
    .default('noreply@nn-company.com'),
  FRONTEND_URL: Joi.string().uri().default('http://localhost:5173'),
});
