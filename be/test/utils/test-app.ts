/**
 * Archivo: test/utils/test-app.ts.
 * Descripción: Crea una instancia real de la aplicación Nest (mismo AppModule,
 *   mismos pipes/guards/filters que producción) para los tests e2e.
 * ¿Para qué? Los tests deben ejercitar la app tal como la vería un cliente HTTP real
 *   — nada de mocks de controllers/services.
 * ¿Impacto? NODE_ENV=test (seteado en el script test:e2e) desactiva el rate limiting
 *   vía el `skipIf` de ThrottlerModule en app.module.ts — sin esto, la ráfaga de
 *   requests del suite de tests dispararía 429 antes de tiempo.
 */

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/bootstrap';

export async function createTestApp(): Promise<INestApplication> {
  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  return app;
}
