/**
 * Archivo: main.ts.
 * Descripción: Punto de entrada — arranca la aplicación Nest con toda la configuración
 *   de seguridad y validación global (delegada a bootstrap.ts).
 * ¿Para qué? Mantener este archivo mínimo: crear la app, configurarla, escuchar el puerto.
 * ¿Impacto? Es el primer archivo que ejecuta Node.js. Si falla aquí, nada funciona.
 */

import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 3000;

  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`🏥 Health check: http://localhost:${port}/health`);
  console.log(`🌍 Environment: ${configService.get<string>('NODE_ENV')}`);
}
void bootstrap();
