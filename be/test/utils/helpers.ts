/**
 * Archivo: test/utils/helpers.ts.
 * Descripción: Helpers reutilizables para los tests e2e — evitan repetir setup en
 *   cada archivo de tests (registrar, verificar email, loguear).
 * ¿Para qué? Los tests de rutas protegidas necesitan un access token válido; los de
 *   verify-email necesitan tokens con distintos estados (válido/usado/expirado).
 * ¿Impacto? Centralizar la creación de datos de prueba facilita el mantenimiento.
 */

import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as crypto from 'node:crypto';
import request from 'supertest';
import type { Repository } from 'typeorm';
import { EmailVerificationToken } from '../../src/auth/entities/email-verification-token.entity';
import { User } from '../../src/users/entities/user.entity';

export const TEST_USER = {
  email: 'test@nn-company.com',
  fullName: 'Test User',
  password: 'Password1234',
};

interface RegisteredUser {
  id: string;
  email: string;
  fullName: string;
}

// ¿Qué? Registra un usuario de prueba (email SIN verificar) vía HTTP real.
export async function createTestUser(
  app: INestApplication,
  overrides: Partial<typeof TEST_USER> = {},
): Promise<RegisteredUser> {
  const userData = { ...TEST_USER, ...overrides };
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/register')
    .send(userData);
  return res.body.data as RegisteredUser;
}

// ¿Qué? Registra un usuario y lo activa directamente en la BD (sin flujo de email).
// ¿Para qué? La mayoría de los tests necesitan un usuario listo para loguearse — este
//   helper evita tener que simular el envío/verificación de email en cada test.
export async function createVerifiedTestUser(
  app: INestApplication,
  overrides: Partial<typeof TEST_USER> = {},
): Promise<RegisteredUser> {
  const user = await createTestUser(app, overrides);
  const usersRepository: Repository<User> = app.get(getRepositoryToken(User));
  await usersRepository.update({ id: user.id }, { isEmailVerified: true });
  return user;
}

// ¿Qué? Crea un token de verificación de email directamente en la BD de tests.
export async function createVerificationToken(
  app: INestApplication,
  userId?: string,
  options: { expiresIn?: number; used?: boolean } = {},
): Promise<{ userId: string; token: string }> {
  let id = userId;
  if (!id) {
    const user = await createTestUser(app);
    id = user.id;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(
    Date.now() + (options.expiresIn ?? 24 * 60 * 60 * 1000),
  );

  const tokensRepository: Repository<EmailVerificationToken> = app.get(
    getRepositoryToken(EmailVerificationToken),
  );
  await tokensRepository.save(
    tokensRepository.create({
      userId: id,
      token,
      expiresAt,
      used: options.used ?? false,
    }),
  );

  return { userId: id, token };
}

// ¿Qué? Registra, verifica y loguea un usuario de prueba, retornando los tokens.
export async function loginTestUser(
  app: INestApplication,
  credentials: Partial<{ email: string; password: string }> = {},
): Promise<{ accessToken: string; refreshToken: string }> {
  await createVerifiedTestUser(app);
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({
      email: credentials.email ?? TEST_USER.email,
      password: credentials.password ?? TEST_USER.password,
    });
  return res.body.data as { accessToken: string; refreshToken: string };
}
