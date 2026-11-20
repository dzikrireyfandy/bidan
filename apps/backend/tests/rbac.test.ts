import request from 'supertest';
import express, { Application } from 'express';
import { signToken, authenticate } from '../src/middleware/auth';
import { PERAN, SUB_PERAN, requireRole, requireSubPeran, allowSelf } from '../src/middleware/rbac';
import { clientContext } from '../src/middleware/clientContext';
import { errorHandler, notFoundHandler } from '../src/middleware/errorHandler';

describe('RBAC & Auth & Client Context Integration Tests', () => {
  let app: Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(clientContext);

    // Probe routes
    app.get('/probe/dokter', authenticate, requireRole(PERAN.DOKTER, PERAN.SUPERADMIN), (_req, res) => {
      res.json({ success: true, data: { message: 'ok' } });
    });

    app.get('/probe/admin', authenticate, requireRole(PERAN.ADMIN_LOKAL, PERAN.SUPERADMIN), (_req, res) => {
      res.json({ success: true, data: { message: 'ok' } });
    });

    app.get('/probe/perawat', authenticate, requireSubPeran(SUB_PERAN.PERAWAT), (_req, res) => {
      res.json({ success: true, data: { message: 'ok' } });
    });

    app.get('/probe/self/:id', authenticate, allowSelf((req) => String(req.params['id'])), (_req, res) => {
      res.json({ success: true, data: { message: 'ok' } });
    });

    app.use(notFoundHandler);
    app.use(errorHandler);
  });

  test('no token returns 401 with standard error envelope', async () => {
    const response = await request(app).get('/probe/dokter');
    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 401,
        errorId: 'ERR-AUTH-01',
        message: 'Token tidak ditemukan',
        details: null
      }
    });
  });

  test('valid SUPERADMIN token on /probe/dokter returns 200', async () => {
    const token = signToken({ akunId: 'acc-1', peran: PERAN.SUPERADMIN });
    const response = await request(app)
      .get('/probe/dokter')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { message: 'ok' }
    });
  });

  test('valid PASIEN token on /probe/dokter returns 403', async () => {
    const token = signToken({ akunId: 'acc-2', peran: PERAN.PASIEN, pasienId: 'pas-1' });
    const response = await request(app)
      .get('/probe/dokter')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe(403);
  });

  test('STAFF with subPeran PERAWAT on /probe/perawat returns 200', async () => {
    const token = signToken({ akunId: 'acc-3', peran: PERAN.STAFF, subPeran: SUB_PERAN.PERAWAT, stafId: 'stf-1' });
    const response = await request(app)
      .get('/probe/perawat')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { message: 'ok' }
    });
  });

  test('STAFF with subPeran RESEPSIONIS on /probe/perawat returns 403', async () => {
    const token = signToken({ akunId: 'acc-4', peran: PERAN.STAFF, subPeran: SUB_PERAN.RESEPSIONIS, stafId: 'stf-2' });
    const response = await request(app)
      .get('/probe/perawat')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  test('allowSelf: PASIEN with pasienId X on /probe/self/X returns 200', async () => {
    const token = signToken({ akunId: 'acc-5', peran: PERAN.PASIEN, pasienId: 'pas-100' });
    const response = await request(app)
      .get('/probe/self/pas-100')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { message: 'ok' }
    });
  });

  test('allowSelf: PASIEN with pasienId X on /probe/self/Y returns 403', async () => {
    const token = signToken({ akunId: 'acc-5', peran: PERAN.PASIEN, pasienId: 'pas-100' });
    const response = await request(app)
      .get('/probe/self/pas-200')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  test('expired or invalid token returns 401', async () => {
    const response = await request(app)
      .get('/probe/dokter')
      .set('Authorization', 'Bearer invalidtokenxyz');
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe(401);
  });

  test('clientContext defaults to PORTAL and recognizes valid headers', async () => {
    const clientAppApp = express();
    clientAppApp.use(clientContext);
    clientAppApp.get('/test-client', (req, res) => {
      res.json({ clientApp: req.clientApp });
    });

    const r1 = await request(clientAppApp).get('/test-client');
    expect(r1.body.clientApp).toBe('PORTAL');

    const r2 = await request(clientAppApp).get('/test-client').set('X-Client-App', 'RS');
    expect(r2.body.clientApp).toBe('RS');

    const r3 = await request(clientAppApp).get('/test-client').set('X-Client-App', 'INVALID_APP');
    expect(r3.status).toBe(400);
  });
});
