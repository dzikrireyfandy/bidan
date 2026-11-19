import request from 'supertest';
import createApp from '../src/app';
import { Application } from 'express';

describe('Health & Error Handling Integration Tests', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp();
  });

  test('GET /health returns 200 and success status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        status: 'ok',
        uptime: expect.any(Number)
      }
    });
  });

  test('Unknown route returns 404 with standard error envelope', async () => {
    const response = await request(app).get('/unknown-route-xyz');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 404,
        message: expect.stringContaining('Route not found'),
        details: null
      }
    });
  });

  test('GET /api/v1 returns API version info', async () => {
    const response = await request(app).get('/api/v1');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        name: 'API Kesehatan Terintegrasi',
        version: '1.0.0',
        status: 'active'
      }
    });
  });
});
