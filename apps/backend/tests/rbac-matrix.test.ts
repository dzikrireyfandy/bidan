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
import type { Profile } from '../src/types';

const SEMUA_PROFIL: Profile[] = [
  'SUPERADMIN',
  'ADMIN_LOKAL',
  'DOKTER',
  'STAFF:PERAWAT',
  'STAFF:RESEPSIONIS',
  'PASIEN'
];

const STAF_ID = '11111111-1111-1111-1111-111111111111';
const PASIEN_ID = '22222222-2222-2222-2222-222222222222';

const tokenUntuk = (profil: Profile): string => {
  if (profil === 'STAFF:PERAWAT' || profil === 'STAFF:RESEPSIONIS') {
    return signToken({
      akunId: 'akun-staff',
      peran: 'STAFF',
      subPeran: profil === 'STAFF:PERAWAT' ? 'PERAWAT' : 'RESEPSIONIS',
      stafId: STAF_ID
    });
  }
  return signToken({
    akunId: `akun-${profil.toLowerCase()}`,
    peran: profil,
    stafId: profil === 'PASIEN' ? null : STAF_ID,
    pasienId: profil === 'PASIEN' ? PASIEN_ID : null
  });
};

const resolvedPath = (path: string): string => {
  const uuid = '00000000-0000-0000-0000-000000000000';
  return path.replace(':ref_tipe', 'LAYANAN').replace(/:ref_id|:id/g, uuid);
};

const app = express();
app.use(express.json());
app.use('/api/v1', v1Router);
app.use(notFoundHandler);
app.use(errorHandler);

const semuaRute = getRouteRegistry().filter((meta) => meta.auth);

describe('Matriks RBAC 126 endpoint', () => {
  test('setiap kombinasi rute x profil diuji', () => {
    expect(semuaRute.length).toBeGreaterThan(80);
    expect(semuaRute.length * SEMUA_PROFIL.length).toBe(
      semuaRute.reduce((total, meta) => total + SEMUA_PROFIL.length, 0)
    );
  });

  test.each(
    semuaRute.flatMap((meta) =>
      SEMUA_PROFIL.map((profil) => [meta.method.toUpperCase(), meta.path, profil, meta.profiles.includes(profil)] as const)
    )
  )('%s %s sebagai %s -> %s', async (method, path, profil, diizinkan) => {
    const response = await request(app)
      [method.toLowerCase() as 'post' | 'patch' | 'put' | 'delete'](`/api/v1${resolvedPath(path)}`)
      .set('Authorization', `Bearer ${tokenUntuk(profil)}`)
      .send({});

    if (diizinkan) {
      expect(response.status).not.toBe(403);
    } else {
      expect(response.status).toBe(403);
      expect(response.body.error.errorId).toBe('ERR-AUTH-03');
    }
  });
});

describe('RBAC presisi untuk baris kritis TSD', () => {
  const profilUntuk = (method: string, path: string): readonly Profile[] => {
    const meta = getRouteRegistry().find(
      (item) => item.method === method && item.path === path
    );
    if (!meta) {
      throw new Error(`Rute tidak ditemukan: ${method} ${path}`);
    }
    return meta.profiles;
  };

  test('walk-in hanya untuk resepsionis', () => {
    expect(profilUntuk('post', '/pasien/walk-in')).toEqual([
      'SUPERADMIN',
      'ADMIN_LOKAL',
      'STAFF:RESEPSIONIS'
    ]);
  });

  test('daftar pasien dan RME hanya untuk perawat', () => {
    expect(profilUntuk('post', '/pasien/list')).toEqual(['SUPERADMIN', 'DOKTER', 'STAFF:PERAWAT']);
    expect(profilUntuk('post', '/pasien/:id/rme/detail')).toEqual([
      'SUPERADMIN',
      'DOKTER',
      'STAFF:PERAWAT'
    ]);
  });

  test('batch obat tidak boleh diakses dokter', () => {
    expect(profilUntuk('post', '/obat/:id/batch/list')).toEqual([
      'SUPERADMIN',
      'ADMIN_LOKAL',
      'STAFF:PERAWAT'
    ]);
    expect(profilUntuk('post', '/gudang/list')).not.toContain('DOKTER');
    expect(profilUntuk('post', '/resep/:id/pengeluaran')).not.toContain('DOKTER');
  });

  test('operasi list boleh admin lokal tetapi update tidak', () => {
    expect(profilUntuk('post', '/operasi/list')).toContain('ADMIN_LOKAL');
    expect(profilUntuk('patch', '/operasi/:id')).not.toContain('ADMIN_LOKAL');
  });

  test('insiden hanya dapat diubah admin atau dokter', () => {
    expect(profilUntuk('patch', '/insiden/:id')).toEqual(['SUPERADMIN', 'ADMIN_LOKAL', 'DOKTER']);
  });

  test('ambulans dan harga mengikuti sub-peran yang tepat', () => {
    expect(profilUntuk('post', '/ambulans/list')).toEqual([
      'SUPERADMIN',
      'ADMIN_LOKAL',
      'STAFF:PERAWAT',
      'STAFF:RESEPSIONIS'
    ]);
    expect(profilUntuk('post', '/ambulans/:id/perjalanan')).toEqual([
      'SUPERADMIN',
      'ADMIN_LOKAL',
      'STAFF:RESEPSIONIS'
    ]);
    expect(profilUntuk('put', '/harga/:ref_tipe/:ref_id')).toEqual(['SUPERADMIN', 'ADMIN_LOKAL']);
  });

  test('notifikasi hanya untuk resepsionis dan akun staf hanya superadmin', () => {
    expect(profilUntuk('post', '/notifikasi/log/list')).toEqual([
      'SUPERADMIN',
      'ADMIN_LOKAL',
      'STAFF:RESEPSIONIS'
    ]);
    expect(profilUntuk('post', '/staf/:id/akun')).toEqual(['SUPERADMIN']);
  });
});
