/**
 * Archivo: test/utils/db.ts.
 * Descripción: Helper para limpiar la base de datos entre tests e2e.
 * ¿Para qué? Garantizar que cada test parte de un estado limpio y predecible —
 *   sin esto, el orden de ejecución de tests podría causar fallas intermitentes.
 * ¿Impacto? TRUNCATE ... CASCADE también vacía las tablas de tokens (FK a users),
 *   evitando el orden manual DELETE que exigiría el sistema de referencia sin CASCADE.
 */

import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';

export async function truncateAllTables(app: INestApplication): Promise<void> {
  const dataSource = app.get(DataSource);
  await dataSource.query(
    'TRUNCATE TABLE "password_reset_tokens", "email_verification_tokens", "users" RESTART IDENTITY CASCADE',
  );
}
