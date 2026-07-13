/**
 * Archivo: app.controller.ts.
 * Descripción: Controller raíz — expone únicamente el health check.
 * ¿Para qué? Permitir que herramientas de monitoreo y Docker verifiquen que el
 *   servidor está activo, sin pasar por el prefijo /api/v1 ni por autenticación.
 */

import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  // ¿Qué? GET /health — excluido del prefijo global api/v1 en main.ts.
  @Get('health')
  getHealth(): { status: 'ok'; timestamp: string } {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
