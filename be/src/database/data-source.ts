/**
 * Archivo: database/data-source.ts.
 * Descripción: DataSource de TypeORM usado exclusivamente por la CLI (migration:generate,
 *   migration:run, migration:revert) — fuera del ciclo de vida de Nest.
 * ¿Para qué? La CLI de TypeORM necesita una instancia de DataSource "standalone" (sin
 *   Dependency Injection de Nest) para poder conectarse y generar/aplicar migraciones.
 * ¿Impacto? Este archivo debe reflejar exactamente las mismas entidades que TypeOrmModule
 *   en app.module.ts — si divergen, las migraciones generadas no coincidirán con el runtime.
 */

import 'dotenv/config';
import { DataSource } from 'typeorm';
import { entities } from './entities';

// ¿Qué? Única exportación default — la CLI de TypeORM exige exactamente un DataSource por archivo.
const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities,
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  // ¿Qué? synchronize siempre en false — el esquema solo cambia vía migraciones versionadas.
  // ¿Para qué? Evitar drift entre entornos (dev/test/prod) y cambios de esquema accidentales.
  synchronize: false,
});

export default AppDataSource;
