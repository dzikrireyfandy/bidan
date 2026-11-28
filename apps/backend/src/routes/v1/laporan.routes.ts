import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireProfiles } from '../../middleware/rbac';
import { validate } from './_validate';
import { defineRoute } from './_registry';
import { emptyBodySchema, idParams } from '../../validation/common';
import { ADMIN_LOKAL, P } from '../../auth/profiles';
import { kontenSchema, kontenUpdateSchema, periodeSchema } from '../../validation/laporan';
import {
  createKonten,
  deleteKonten,
  exportLaporan,
  jamTersibuk,
  kirimUlangNotifikasi,
  listAudit,
  listKonten,
  listNotifikasi,
  perbandingan,
  ringkasan,
  trenLayanan,
  updateKonten
} from '../../controllers/laporan.controller';

const router = Router();

// Spesifikasi Bagian B, D, & E: Laporan Operasional & Analisis Efek Harga HANYA untuk Bidan (DOKTER).
const ONLY_BIDAN = [P.DOKTER] as const;
const NOTIFIKASI = [P.SUPERADMIN, P.ADMIN_LOKAL, P.RESEPSIONIS];

const registerPeriode = (
  method: 'post',
  path: string,
  profiles: readonly import('../../types').Profile[],
  handler: import('express').RequestHandler
): void => {
  defineRoute(
    router,
    { method, path, auth: true, profiles, schemas: { body: periodeSchema } },
    authenticate,
    requireProfiles(...profiles),
    validate({ body: periodeSchema }),
    handler
  );
};

registerPeriode('post', '/laporan/ringkasan/list', ONLY_BIDAN, ringkasan);
registerPeriode('post', '/laporan/tren-layanan/list', ONLY_BIDAN, trenLayanan);
registerPeriode('post', '/laporan/perbandingan/list', ONLY_BIDAN, perbandingan);
registerPeriode('post', '/laporan/export', ONLY_BIDAN, exportLaporan);

defineRoute(
  router,
  {
    method: 'post',
    path: '/laporan/jam-tersibuk/list',
    auth: true,
    profiles: ONLY_BIDAN,
    schemas: { body: emptyBodySchema }
  },
  authenticate,
  requireProfiles(...ONLY_BIDAN),
  validate({ body: emptyBodySchema }),
  jamTersibuk
);

registerPeriode('post', '/konten/list', ADMIN_LOKAL, listKonten);
registerPeriode('post', '/notifikasi/log/list', NOTIFIKASI, listNotifikasi);
registerPeriode('post', '/audit-logs/list', ADMIN_LOKAL, listAudit);

defineRoute(
  router,
  { method: 'post', path: '/konten', auth: true, profiles: ADMIN_LOKAL, schemas: { body: kontenSchema } },
  authenticate,
  requireProfiles(...ADMIN_LOKAL),
  validate({ body: kontenSchema }),
  createKonten
);

defineRoute(
  router,
  {
    method: 'patch',
    path: '/konten/:id',
    auth: true,
    profiles: ADMIN_LOKAL,
    schemas: { params: idParams, body: kontenUpdateSchema }
  },
  authenticate,
  requireProfiles(...ADMIN_LOKAL),
  validate({ params: idParams, body: kontenUpdateSchema }),
  updateKonten
);

defineRoute(
  router,
  {
    method: 'delete',
    path: '/konten/:id',
    auth: true,
    profiles: ADMIN_LOKAL,
    schemas: { params: idParams }
  },
  authenticate,
  requireProfiles(...ADMIN_LOKAL),
  validate({ params: idParams }),
  deleteKonten
);

defineRoute(
  router,
  {
    method: 'post',
    path: '/notifikasi/:id/kirim-ulang',
    auth: true,
    profiles: NOTIFIKASI,
    schemas: { params: idParams }
  },
  authenticate,
  requireProfiles(...NOTIFIKASI),
  validate({ params: idParams }),
  kirimUlangNotifikasi
);

export default router;
