/**
 * Archivo: common/filters/all-exceptions.filter.ts.
 * Descripción: Filtro global de excepciones — transforma cualquier error lanzado en
 *   controllers/services/guards en una respuesta JSON consistente.
 * ¿Para qué? Centralizar el formato de error en un solo lugar, igual que el
 *   `errorHandler` de Express en el sistema de referencia.
 * ¿Impacto? Sin este filtro, Nest usaría su formato de error por defecto
 *   (`{statusCode, message, error}`), que no coincide con el contrato que
 *   el frontend ya espera: `{ success: false, error: { code, message }, details? }`.
 */

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import type { Response } from 'express';

// ¿Qué? Traduce el status HTTP al código interno estable que consume el frontend.
// ¿Para qué? Mantener el mismo vocabulario de códigos que la referencia Express
//   (VALIDATION_ERROR, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT, ...).
const STATUS_CODE_MAP: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'VALIDATION_ERROR',
  429: 'TOO_MANY_REQUESTS',
  500: 'INTERNAL_ERROR',
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : 500;

    let message = 'Internal server error';
    let details: unknown;

    if (isHttpException) {
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (body && typeof body === 'object') {
        const record = body as Record<string, unknown>;
        if (typeof record.message === 'string') {
          message = record.message;
        } else if (Array.isArray(record.message)) {
          message = record.message.join(', ');
        } else {
          message = exception.message;
        }
        details = record.details;
      }
    } else {
      // ¿Qué? Error no anticipado — loggear sin exponer detalles internos al cliente.
      console.error('[ERROR]', exception);
    }

    response.status(status).json({
      success: false,
      error: { code: STATUS_CODE_MAP[status] ?? 'INTERNAL_ERROR', message },
      ...(details !== undefined ? { details } : {}),
    });
  }
}
