import request from 'supertest';
import jwt from 'jsonwebtoken';
import createApp from '../src/app';
import config from '../src/config/env';
import { resetRateLimit } from '../src/middleware/rateLimit';

describe('Kontrak validasi request', () => {
  const app = createApp();

  test('body tidak valid menghasilkan 422 dengan ERR-VAL-01', async () => {
    const response = await request(app).post('/api/v1/public/reservasi').send({});
    expect(response.status).toBe(422);
    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: 422,
        errorId: 'ERR-VAL-01',
        details: expect.any(Array)
      }
    });
  });

  test('password login kurang dari 8 karakter ditolak 422', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'pendek' });
    expect(response.status).toBe(422);
    expect(response.body.error.errorId).toBe('ERR-VAL-01');
  });

  test('NIK bukan 16 digit ditolak 422', async () => {
    const response = await request(app)
      .post('/api/v1/public/pasien/cek')
      .send({ nik: '123' });
    expect(response.status).toBe(422);
    expect(response.body.error.errorId).toBe('ERR-VAL-01');
  });
});

describe('Keamanan origin dan rate limit', () => {
  const app = createApp();

  test('origin asing ditolak 403 sebelum CORS', async () => {
    const response = await request(app).get('/health').set('Origin', 'http://evil.example');
    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: 403, errorId: 'ERR-AUTH-03' }
    });
  });

  test('origin yang diizinkan mendapatkan header CORS', async () => {
    const origin = config.ALLOWED_ORIGINS[0] as string;
    const response = await request(app).get('/health').set('Origin', origin);
    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe(origin);
  });

  test('burst melebihi batas login mengembalikan 429', async () => {
    resetRateLimit();
    const batas = Math.max(config.AUTH_RATE_LIMIT_MAX, 1);
    for (let i = 0; i < batas; i += 1) {
      await request(app).post('/api/v1/auth/login').send({});
    }
    const response = await request(app).post('/api/v1/auth/login').send({});
    expect(response.status).toBe(429);
    expect(response.body.error.errorId).toBe('ERR-SYS-03');
  });

  test('respons rate limit menyertakan header kuota', async () => {
    resetRateLimit();
    const response = await request(app).post('/api/v1/auth/login').send({});
    expect(response.headers['x-ratelimit-limit']).toBe(String(config.AUTH_RATE_LIMIT_MAX));
    expect(response.headers['x-ratelimit-remaining']).toBeDefined();
  });

  test('preflight dari origin asing ditolak 403', async () => {
    const response = await request(app)
      .options('/api/v1/auth/login')
      .set('Origin', 'http://evil.example')
      .set('Access-Control-Request-Method', 'POST');
    expect(response.status).toBe(403);
    expect(response.body.error.errorId).toBe('ERR-AUTH-03');
  });

  test('preflight dari origin yang diizinkan mengembalikan header CORS', async () => {
    const origin = config.ALLOWED_ORIGINS[0] as string;
    const response = await request(app)
      .options('/api/v1/auth/login')
      .set('Origin', origin)
      .set('Access-Control-Request-Method', 'POST');
    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe(origin);
  });

  test('token kedaluwarsa menghasilkan 401 ERR-AUTH-04', async () => {
    const token = jwt.sign({ sub: 'akun-uji', peran: 'SUPERADMIN' }, config.JWT_SECRET, { expiresIn: -1 });
    const response = await request(app)
      .post('/api/v1/unit-pelayanan/list')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(response.status).toBe(401);
    expect(response.body.error.errorId).toBe('ERR-AUTH-04');
  });
});
