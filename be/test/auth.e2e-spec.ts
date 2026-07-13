/**
 * Archivo: test/auth.e2e-spec.ts.
 * Descripción: Tests e2e para todos los endpoints de autenticación.
 * ¿Para qué? Verificar que el flujo completo de auth funciona correctamente:
 *   registro, verificación de email, login, refresh, cambio de contraseña,
 *   recuperación y reset — igual profundidad que el sistema de referencia Express.
 * ¿Impacto? Si estos tests no cubren los happy paths y los casos de error, podríamos
 *   desplegar código roto sin saberlo.
 */

import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { truncateAllTables } from './utils/db';
import {
  createTestUser,
  createVerificationToken,
  createVerifiedTestUser,
  loginTestUser,
  TEST_USER,
} from './utils/helpers';
import { createTestApp } from './utils/test-app';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await truncateAllTables(app);
  });

  // ---------------------------------------------------------------------------
  // POST /api/v1/auth/register
  // ---------------------------------------------------------------------------
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user and return 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(TEST_USER);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).not.toHaveProperty('hashedPassword');
      expect(res.body.data).not.toHaveProperty('password');
      expect(res.body.data.email).toBe(TEST_USER.email);
      expect(res.body.data.isEmailVerified).toBe(false);
    });

    it('should return 409 if email is already registered', async () => {
      await createTestUser(app);
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(TEST_USER);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should return 422 with invalid email', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ ...TEST_USER, email: 'not-an-email' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should return 422 with weak password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ ...TEST_USER, password: '12345678' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should return 422 with empty body', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({});

      expect(res.status).toBe(422);
    });

    it('should return 422 with an unexpected extra field (forbidNonWhitelisted)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ ...TEST_USER, isAdmin: true });

      expect(res.status).toBe(422);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /api/v1/auth/login
  // ---------------------------------------------------------------------------
  describe('POST /api/v1/auth/login', () => {
    it('should login and return tokens on valid credentials', async () => {
      await createVerifiedTestUser(app);
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: TEST_USER.email, password: TEST_USER.password });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.tokenType).toBe('bearer');
    });

    it('should return 403 when email is not verified', async () => {
      await createTestUser(app);
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: TEST_USER.email, password: TEST_USER.password });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 with wrong password', async () => {
      await createVerifiedTestUser(app);
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: TEST_USER.email, password: 'WrongPass99' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 with non-existent email', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'noexiste@nn-company.com',
          password: TEST_USER.password,
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 422 with missing password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: TEST_USER.email });

      expect(res.status).toBe(422);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /api/v1/auth/refresh
  // ---------------------------------------------------------------------------
  describe('POST /api/v1/auth/refresh', () => {
    it('should return a new token pair with a valid refresh token', async () => {
      const { refreshToken } = await loginTestUser(app);
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
    });

    it('should return 401 with an invalid refresh token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'this.is.not.a.valid.jwt' });

      expect(res.status).toBe(401);
    });

    it('should return 422 with missing refreshToken field', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({});

      expect(res.status).toBe(422);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /api/v1/auth/change-password
  // ---------------------------------------------------------------------------
  describe('POST /api/v1/auth/change-password', () => {
    it('should change password when authenticated and current password is correct', async () => {
      const { accessToken } = await loginTestUser(app);
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: TEST_USER.password,
          newPassword: 'NewPassword99',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 401 when current password is wrong', async () => {
      const { accessToken } = await loginTestUser(app);
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'WrongCurrent1',
          newPassword: 'NewPassword99',
        });

      expect(res.status).toBe(401);
    });

    it('should return 401 when no Authorization header is provided', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/change-password')
        .send({
          currentPassword: TEST_USER.password,
          newPassword: 'NewPassword99',
        });

      expect(res.status).toBe(401);
    });

    it('should return 422 when new password equals current password', async () => {
      const { accessToken } = await loginTestUser(app);
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: TEST_USER.password,
          newPassword: TEST_USER.password,
        });

      expect(res.status).toBe(422);
    });

    it('should return 422 with a weak new password', async () => {
      const { accessToken } = await loginTestUser(app);
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ currentPassword: TEST_USER.password, newPassword: 'weak' });

      expect(res.status).toBe(422);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /api/v1/auth/forgot-password
  // ---------------------------------------------------------------------------
  describe('POST /api/v1/auth/forgot-password', () => {
    it('should return 200 for a registered email without revealing its existence', async () => {
      await createTestUser(app);
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: TEST_USER.email });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 200 even for an unregistered email (anti user-enumeration)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'noexiste@nn-company.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toEqual(expect.any(String));
    });

    it('should return 422 with invalid email format', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'bad-email' });

      expect(res.status).toBe(422);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /api/v1/auth/reset-password
  // ---------------------------------------------------------------------------
  describe('POST /api/v1/auth/reset-password', () => {
    it('should return 400 with an invalid reset token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'invalid-token-that-does-not-exist',
          newPassword: 'NewPass99',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 422 with missing token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/reset-password')
        .send({ newPassword: 'NewPass99' });

      expect(res.status).toBe(422);
    });

    it('should return 422 with weak new password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/reset-password')
        .send({ token: 'some-token', newPassword: 'weak' });

      expect(res.status).toBe(422);
    });

    it('should allow login with the new password after a successful reset', async () => {
      // ¿Qué? Flujo completo: forgot-password → leer token de la BD → reset-password → login.
      const user = await createVerifiedTestUser(app);
      await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: user.email });

      const dataSource = app.get(DataSource);
      const row = await dataSource.query(
        'SELECT token FROM password_reset_tokens WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
        [user.id],
      );
      const token = row[0].token as string;

      const resetRes = await request(app.getHttpServer())
        .post('/api/v1/auth/reset-password')
        .send({ token, newPassword: 'BrandNewPass9' });
      expect(resetRes.status).toBe(200);

      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: 'BrandNewPass9' });
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data).toHaveProperty('accessToken');
    });
  });

  // ---------------------------------------------------------------------------
  // POST /api/v1/auth/verify-email
  // ---------------------------------------------------------------------------
  describe('POST /api/v1/auth/verify-email', () => {
    it('should verify email and activate account with a valid token', async () => {
      const { token } = await createVerificationToken(app);
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-email')
        .send({ token });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/verificad/i);
    });

    it('should allow login after email verification', async () => {
      const { token } = await createVerificationToken(app);
      await request(app.getHttpServer())
        .post('/api/v1/auth/verify-email')
        .send({ token });

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: TEST_USER.email, password: TEST_USER.password });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('accessToken');
    });

    it('should return 400 with a non-existent token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-email')
        .send({ token: 'a'.repeat(64) });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when token has already been used', async () => {
      const { token } = await createVerificationToken(app, undefined, {
        used: true,
      });
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-email')
        .send({ token });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when token is expired', async () => {
      const { token } = await createVerificationToken(app, undefined, {
        expiresIn: -1000,
      });
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-email')
        .send({ token });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 422 with missing token field', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-email')
        .send({});

      expect(res.status).toBe(422);
    });
  });
});
