/**
 * Archivo: test/users.e2e-spec.ts.
 * Descripción: Tests e2e para GET /users/me y PATCH /users/me/locale.
 * ¿Para qué? El AUDITORIA.md del sistema de referencia Express marca la falta de
 *   tests del controller de usuarios como un gap explícito — este archivo lo cierra.
 */

import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { truncateAllTables } from './utils/db';
import { loginTestUser, TEST_USER } from './utils/helpers';
import { createTestApp } from './utils/test-app';

describe('Users (e2e)', () => {
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
  // GET /api/v1/users/me
  // ---------------------------------------------------------------------------
  describe('GET /api/v1/users/me', () => {
    it('should return the current user profile when authenticated', async () => {
      const { accessToken } = await loginTestUser(app);
      const res = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(TEST_USER.email);
      expect(res.body.data).not.toHaveProperty('hashedPassword');
      expect(res.body.data).toHaveProperty('isEmailVerified', true);
      expect(res.body.data).toHaveProperty('locale', 'es');
      expect(res.body.data).toHaveProperty('updatedAt');
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/users/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 with malformed Bearer token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer not.a.real.token');

      expect(res.status).toBe(401);
    });

    it('should return 401 with an expired/invalid Authorization scheme', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', 'not-even-bearer-format');

      expect(res.status).toBe(401);
    });
  });

  // ---------------------------------------------------------------------------
  // PATCH /api/v1/users/me/locale
  // ---------------------------------------------------------------------------
  describe('PATCH /api/v1/users/me/locale', () => {
    it('should update locale to "en" and return the updated profile', async () => {
      const { accessToken } = await loginTestUser(app);
      const res = await request(app.getHttpServer())
        .patch('/api/v1/users/me/locale')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ locale: 'en' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.locale).toBe('en');
    });

    it('should update locale to "es"', async () => {
      const { accessToken } = await loginTestUser(app);
      const res = await request(app.getHttpServer())
        .patch('/api/v1/users/me/locale')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ locale: 'es' });

      expect(res.status).toBe(200);
      expect(res.body.data.locale).toBe('es');
    });

    it('should persist the locale change across a subsequent GET /me', async () => {
      const { accessToken } = await loginTestUser(app);
      await request(app.getHttpServer())
        .patch('/api/v1/users/me/locale')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ locale: 'en' });

      const res = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.body.data.locale).toBe('en');
    });

    it('should return 422 with an unsupported locale', async () => {
      const { accessToken } = await loginTestUser(app);
      const res = await request(app.getHttpServer())
        .patch('/api/v1/users/me/locale')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ locale: 'fr' });

      expect(res.status).toBe(422);
    });

    it('should return 401 when not authenticated', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/users/me/locale')
        .send({ locale: 'en' });

      expect(res.status).toBe(401);
    });

    it('should return 422 with missing locale field', async () => {
      const { accessToken } = await loginTestUser(app);
      const res = await request(app.getHttpServer())
        .patch('/api/v1/users/me/locale')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      expect(res.status).toBe(422);
    });
  });
});
