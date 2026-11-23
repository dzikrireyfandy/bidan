import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import request from 'supertest';

jest.mock('../src/db/pool', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
    execute: jest.fn(),
    transaction: jest.fn(),
    close: jest.fn(),
    connect: jest.fn()
  },
  SqlConnection: class SqlConnectionStub {}
}));

import v1Router from '../src/routes/v1';
import { getRouteRegistry } from '../src/routes/v1/_registry';
import { errorHandler, notFoundHandler } from '../src/middleware/errorHandler';

interface Layer {
  route?: { path: string; methods: Record<string, boolean> };
  handle?: unknown;
}

interface Rute {
  method: string;
  path: string;
}

const bacaStack = (target: unknown): Layer[] => {
  const stack: unknown = Reflect.get(Object(target), 'stack');
  return Array.isArray(stack) ? (stack as Layer[]) : [];
};

const kumpulkan = (target: unknown, hasil: Rute[] = []): Rute[] => {
  for (const layer of bacaStack(target)) {
    if (layer.route) {
      for (const [method, aktif] of Object.entries(layer.route.methods)) {
        if (aktif) {
          hasil.push({ method: method.toUpperCase(), path: layer.route.path });
        }
      }
    } else if (layer.handle) {
      kumpulkan(layer.handle, hasil);
    }
  }
  return hasil;
};

const routes: Rute[] = kumpulkan(v1Router);

const berlabel = (r: { method: string; path: string }): string => `${r.method} ${r.path}`;

describe('Inventaris endpoint /api/v1', () => {
  const registry = getRouteRegistry();

  test('tepat 129 endpoint bisnis terdaftar', () => {
    const bisnis = routes.filter((rute) => rute.path !== '/');
    expect(bisnis.length).toBe(129);
    expect(registry.length).toBe(129);
  });

  test('tidak ada duplikat method+path', () => {
    const unik = new Set(routes.map(berlabel));
    expect(unik.size).toBe(routes.length);
  });

  test('setiap endpoint memiliki skema validasi sesuai bentuk request', () => {
    // Endpoint aksi tanpa payload: hanya memakai params, tidak butuh body.
    const tanpaBody = new Set([
      'POST /kunjungan/:id/tagihan/detail',
      'POST /pasien/:id/rme/detail',
      'POST /pasien/:id/rme/export',
      'POST /notifikasi/:id/kirim-ulang',
      'PATCH /reservasi/:id/batal'
    ]);

    for (const meta of registry) {
      const label = `${meta.method.toUpperCase()} ${meta.path}`;
      expect(Object.keys(meta.schemas).length).toBeGreaterThan(0);

      if (meta.path.includes(':')) {
        expect({ label, hasParams: meta.schemas.params !== undefined }).toEqual({ label, hasParams: true });
      }

      if (['post', 'patch', 'put'].includes(meta.method) && !tanpaBody.has(label)) {
        expect({ label, hasBody: meta.schemas.body !== undefined }).toEqual({ label, hasBody: true });
      }

      if (meta.auth) {
        expect({ label, punyaProfil: meta.profiles.length > 0 }).toEqual({ label, punyaProfil: true });
      } else {
        expect(meta.profiles).toHaveLength(0);
      }
    }
  });

  test('registry sinkron dengan router yang benar-benar terpasang', () => {
    const dariRouter = new Set(routes.filter((rute) => rute.path !== '/').map(berlabel));
    const dariRegistry = new Set(registry.map((meta) => `${meta.method.toUpperCase()} ${meta.path}`));
    expect([...dariRegistry].sort()).toEqual([...dariRouter].sort());
  });

  test('hanya endpoint publik yang tidak memerlukan autentikasi', () => {
    const publik = registry.filter((meta) => !meta.auth).map((meta) => `${meta.method.toUpperCase()} ${meta.path}`);
    expect(publik.sort()).toEqual(
      [
        'POST /auth/login',
        'POST /auth/register-pasien',
        'POST /auth/reset/request',
        'POST /auth/reset/verify',
        'POST /public/konten/list',
        'POST /public/layanan/list',
        'POST /public/jadwal/list',
        'POST /public/sesi/list',
        'POST /public/pasien/cek',
        'POST /public/reservasi'
      ].sort()
    );
  });

  test('setiap domain memiliki rute', () => {
    const semua = routes.map(berlabel).join('\n');
    for (const domain of [
      '/auth/login',
      '/public/',
      '/master/',
      '/pasien',
      '/reservasi',
      '/kunjungan/',
      '/obat',
      '/resep',
      '/tagihan',
      '/rawat-inap/',
      '/ambulans/',
      '/laporan/',
      '/audit-logs/list',
      '/aset/'
    ]) {
      expect(semua).toContain(domain);
    }
  });
});

describe('Matriks RBAC: rute terlindungi menolak tanpa token', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1', v1Router);
  app.use(notFoundHandler);
  app.use(errorHandler);

  const terlindungi = routes.filter(
    (r) => ['POST', 'PATCH', 'PUT', 'DELETE'].includes(r.method) && !r.path.startsWith('/auth') && !r.path.startsWith('/public')
  );

  test('terdapat rute terlindungi untuk diuji', () => {
    expect(terlindungi.length).toBeGreaterThan(80);
  });

  test.each(terlindungi.map((r) => [berlabel(r), r.method, r.path]))(
    '%s tanpa token -> 401',
    async (_label, method, routePath) => {
      const jalur = routePath.replace(/:[A-Za-z_]+/g, '00000000-0000-0000-0000-000000000000');
      const response = await request(app)[method.toLowerCase() as 'post' | 'patch' | 'put' | 'delete'](
        `/api/v1${jalur}`
      ).send({});
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        error: { code: 401, errorId: 'ERR-AUTH-01', message: 'Token tidak ditemukan', details: null }
      });
    }
  );
});

describe('Kontrak SQL kritis (FEFO & pulang rawat inap)', () => {
  const baca = (relatif: string): string =>
    fs.readFileSync(path.resolve(__dirname, '..', 'src', relatif), 'utf8');

  test('inventaris memanggil sp_pengeluaran_resep_fefo dengan OUTPUT kode_hasil', () => {
    const source = baca('repositories/inventaris.repository.ts');
    expect(source).toContain('sp_pengeluaran_resep_fefo');
    expect(source).toContain('@kode_hasil = @kode OUTPUT');
  });

  test('ranap memanggil sp_pulang_rawat_inap dengan OUTPUT kode_hasil', () => {
    const source = baca('repositories/ranap.repository.ts');
    expect(source).toContain('sp_pulang_rawat_inap');
    expect(source).toContain('@kode_hasil = @kode OUTPUT');
  });

  test('tidak ada SQL mentah di lapisan route', () => {
    const folder = path.resolve(__dirname, '..', 'src', 'routes', 'v1');
    for (const file of fs.readdirSync(folder)) {
      if (!file.endsWith('.routes.ts')) continue;
      const source = fs.readFileSync(path.join(folder, file), 'utf8');
      expect(source).not.toMatch(/\b(SELECT|INSERT INTO|UPDATE\s+\[|DELETE FROM|EXEC\b)/i);
    }
  });

  test('tidak ada akses database langsung di lapisan route dan controller', () => {
    for (const dir of ['routes/v1', 'controllers']) {
      const folder = path.resolve(__dirname, '..', 'src', dir);
      for (const file of fs.readdirSync(folder)) {
        if (!file.endsWith('.ts')) continue;
        const source = fs.readFileSync(path.join(folder, file), 'utf8');
        expect(source).not.toContain("from '../db/pool'");
        expect(source).not.toContain("from '../../db/pool'");
      }
    }
  });
});
