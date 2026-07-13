/**
 * Archivo: bootstrap.ts.
 * Descripción: Configuración de la aplicación Nest compartida entre el punto de
 *   entrada real (main.ts) y los tests e2e (test/utils/test-app.ts).
 * ¿Para qué? Evitar que los tests e2e corran contra una app "casi igual pero no
 *   idéntica" a la de producción — mismos pipes, mismo prefijo, mismo CORS.
 * ¿Impacto? Si este archivo diverge de lo que usan los tests, los tests podrían
 *   pasar en verde sin detectar un ValidationPipe mal configurado en producción.
 */

import {
  UnprocessableEntityException,
  ValidationPipe,
  type INestApplication,
} from '@nestjs/common';
import type { ValidationError } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

function toValidationDetails(
  errors: ValidationError[],
): { field: string; message: string }[] {
  return errors.map((error) => ({
    field: error.property,
    message: Object.values(error.constraints ?? {}).join(', '),
  }));
}

// ¿Qué? Aplica helmet, CORS, ValidationPipe global y el prefijo /api/v1 a una
//   instancia de Nest ya creada (pero sin listen()).
export function configureApp(app: INestApplication): void {
  const configService = app.get(ConfigService);

  app.use(helmet());

  app.enableCors({
    origin: configService.getOrThrow<string>('FRONTEND_URL'),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      errorHttpStatusCode: 422,
      exceptionFactory: (errors) =>
        new UnprocessableEntityException({
          message: 'Validation failed',
          details: toValidationDetails(errors),
        }),
    }),
  );

  app.setGlobalPrefix('api/v1', { exclude: ['health'] });
}
