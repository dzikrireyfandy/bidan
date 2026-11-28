import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireProfiles } from '../../middleware/rbac';
import { validate } from './_validate';
import { defineRoute } from './_registry';
import { emptyBodySchema, idParams } from '../../validation/common';
import { ADMIN_LOKAL, KASIR, P } from '../../auth/profiles';
import { bayarSchema, hargaSchema, refParams, rekapPendapatanSchema, tagihanListSchema } from '../../validation/keuangan';
import {
  bayar,
  detailTagihan,
  listHarga,
  listTagihan,
  rekap,
  rekapPendapatan,
  riwayatHarga,
  setHarga
} from '../../controllers/keuangan.controller';

const router = Router();

const HARGA_BACA = [P.SUPERADMIN, P.ADMIN_LOKAL, P.DOKTER, P.RESEPSIONIS];

defineRoute(
  router,
  {
    method: 'post',
    path: '/kunjungan/:id/tagihan/detail',
    auth: true,
    profiles: KASIR,
    schemas: { params: idParams }
  },
  authenticate,
  requireProfiles(...KASIR),
  validate({ params: idParams }),
  detailTagihan
);

defineRoute(
  router,
  {
    method: 'post',
    path: '/tagihan/:id/pembayaran',
    auth: true,
    profiles: KASIR,
    schemas: { params: idParams, body: bayarSchema }
  },
  authenticate,
  requireProfiles(...KASIR),
  validate({ params: idParams, body: bayarSchema }),
  bayar
);

defineRoute(
  router,
  {
    method: 'post',
    path: '/tagihan/list',
    auth: true,
    profiles: KASIR,
    schemas: { body: tagihanListSchema }
  },
  authenticate,
  requireProfiles(...KASIR),
  validate({ body: tagihanListSchema }),
  listTagihan
);

defineRoute(
  router,
  {
    method: 'post',
    path: '/keuangan/rekap/list',
    auth: true,
    profiles: HARGA_BACA,
    schemas: { body: tagihanListSchema }
  },
  authenticate,
  requireProfiles(...HARGA_BACA),
  validate({ body: tagihanListSchema }),
  rekap
);

defineRoute(
  router,
  {
    method: 'post',
    path: '/keuangan/rekap-pendapatan/list',
    auth: true,
    profiles: HARGA_BACA,
    schemas: { body: rekapPendapatanSchema }
  },
  authenticate,
  requireProfiles(...HARGA_BACA),
  validate({ body: rekapPendapatanSchema }),
  rekapPendapatan
);

defineRoute(
  router,
  {
    method: 'post',
    path: '/harga/list',
    auth: true,
    profiles: HARGA_BACA,
    schemas: { body: emptyBodySchema }
  },
  authenticate,
  requireProfiles(...HARGA_BACA),
  validate({ body: emptyBodySchema }),
  listHarga
);

defineRoute(
  router,
  {
    method: 'put',
    path: '/harga/:ref_tipe/:ref_id',
    auth: true,
    profiles: ADMIN_LOKAL,
    schemas: { params: refParams, body: hargaSchema }
  },
  authenticate,
  requireProfiles(...ADMIN_LOKAL),
  validate({ params: refParams, body: hargaSchema }),
  setHarga
);

defineRoute(
  router,
  {
    method: 'post',
    path: '/harga/:ref_tipe/:ref_id/riwayat/list',
    auth: true,
    profiles: ADMIN_LOKAL,
    schemas: { params: refParams, body: emptyBodySchema }
  },
  authenticate,
  requireProfiles(...ADMIN_LOKAL),
  validate({ params: refParams, body: emptyBodySchema }),
  riwayatHarga
);

export default router;
