/**
 * Archivo: app.module.ts.
 * Descripción: Módulo raíz — cablea configuración global (env, BD, throttling) y
 *   los módulos de dominio (auth, users).
 * ¿Para qué? Punto único donde se registran providers globales (APP_FILTER, APP_GUARD).
 * ¿Impacto? Un error aquí (ej: falta ConfigModule) rompe toda la aplicación al arrancar.
 */

import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { envValidationSchema } from './config/env.validation';
import { entities } from './database/entities';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    // ¿Qué? isGlobal:true evita reimportar ConfigModule en cada módulo de dominio.
    // ¿Para qué? validationSchema falla-rápido si falta una variable de entorno crítica.
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.getOrThrow<string>('DATABASE_URL'),
        entities,
        // ¿Qué? El esquema solo cambia vía migraciones — nunca por auto-sincronización.
        synchronize: false,
      }),
    }),
    // ¿Qué? Límite global generoso (100 req/min); los límites estrictos de los
    //   endpoints sensibles (login, register, forgot-password) se aplican por ruta
    //   con @Throttle en sus controllers.
    // ¿Impacto? skipIf desactiva el throttling en NODE_ENV=test para no obtener 429
    //   por la ráfaga de peticiones que genera el suite de tests e2e.
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', ttl: 60_000, limit: 100 }],
      skipIf: () => process.env.NODE_ENV === 'test',
    }),
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
