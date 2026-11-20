import express from 'express';
import request from 'supertest';

jest.mock('../src/db/pool', () => ({
  __esModule: true,
  default: {
    query: jest.fn().mockResolvedValue({ recordset: [] }),
    execute: jest.fn().mockResolvedValue({ recordset: [] }),
    transaction: jest.fn(),
    close: jest.fn(),
    connect: jest.fn()
  },
  SqlConnection: class SqlConnectionStub {}
}));

import v1Router from '../src/routes/v1';
import { getRouteRegistry } from '../src/routes/v1/_registry';
import { signToken } from '../src/middleware/auth';
import { errorHandler, notFoundHandler } from '../src/middleware/errorHandler';

const STAF_ID = '11111111-1111-1111-1111-111111111111';

const tokenSuperadmin = signToken({
  akunId: 'akun-superadmin',
  peran: 'SUPERADMIN',
  stafId: STAF_ID
});

const jabat = (path: string): string =>
  path.replace(':ref_tipe', 'LAYANAN').replace(/:ref_id|:id/g, '00000000-0000-0000-0000-000000000000');

const app = express();
app.use(express.json());
app.use('/api/v1', v1Router);
app.use(notFoundHandler);
app.use(errorHandler);

describe('Smoke 126 endpoint', () => {
  const registry = getRouteRegistry();

  test('seluruh endpoint terdaftar tepat 126', () => {
    expect(registry).toHaveLength(126);
  });

  test.each(registry.map((meta) => [meta.method.toUpperCase(), meta.path, meta.auth] as const))(
    '%s %s dapat dijangkau',
    async (method, path, perluAuth) => {
      const permintaan = request(app)
        [method.toLowerCase() as 'post' | 'patch' | 'put' | 'delete'](`/api/v1${jabat(path)}`)
        .send({});

      if (perluAuth) {
        permintaan.set('Authorization', `Bearer ${tokenSuperadmin}`);
      }

      const response = await permintaan;
      if (response.status === 404) {
        expect(response.body.error.message).not.toContain('Route not found');
      }
      expect(response.status).toBeLessThan(600);
    }
  );
});
