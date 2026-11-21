import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireProfiles } from '../../middleware/rbac';
import { validate } from './_validate';
import { defineRoute } from './_registry';
import { emptyBodySchema, idParams } from '../../validation/common';
import { ADMIN_LOKAL, DOKTER, KLINIS, P, SEMUA_STAF } from '../../auth/profiles';
import {
  admisiSchema,
  ambulansSchema,
  operasiSchema,
  operasiUpdateSchema,
  perjalananSchema,
  pindahSchema,
  pulangSchema,
  ranapListSchema,
  triaseSchema,
  visiteSchema
} from '../../validation/ranap';
import {
  admisi,
  createAmbulans,
  createOperasi,
  createPerjalanan,
  listAmbulans,
  listIgdAntrean,
  listOperasi,
  listPerjalanan,
  listTempatTidur,
  pindah,
  pulang,
  triase,
  updateOperasi,
  visite
} from '../../controllers/ranap.controller';

const router = Router();

const ADMISI = [P.SUPERADMIN, P.PERAWAT, P.RESEPSIONIS];
const PINDAH = [P.SUPERADMIN, P.PERAWAT];
const OPERASI_LIST = [P.SUPERADMIN, P.ADMIN_LOKAL, P.DOKTER, P.PERAWAT];
const AMBULANS_BACA = [P.SUPERADMIN, P.ADMIN_LOKAL, P.PERAWAT, P.RESEPSIONIS];
const AMBULANS_PERJALANAN = [P.SUPERADMIN, P.ADMIN_LOKAL, P.RESEPSIONIS];

defineRoute(
  router,
  {
    method: 'post',
    path: '/rawat-inap/tempat-tidur/list',
    auth: true,
    profiles: SEMUA_STAF,
    schemas: { body: ranapListSchema }
  },
  authenticate,
  requireProfiles(...SEMUA_STAF),
  validate({ body: ranapListSchema }),
  listTempatTidur
);

defineRoute(
  router,
  {
    method: 'post',
    path: '/kunjungan/:id/rawat-inap',
    auth: true,
    profiles: ADMISI,
    schemas: { params: idParams, body: admisiSchema }
  },
  authenticate,
  requireProfiles(...ADMISI),
  validate({ params: idParams, body: admisiSchema }),
  admisi
);

defineRoute(
  router,
  {
    method: 'patch',
    path: '/rawat-inap/:id/pindah',
    auth: true,
    profiles: PINDAH,
    schemas: { params: idParams, body: pindahSchema }
  },
  authenticate,
  requireProfiles(...PINDAH),
  validate({ params: idParams, body: pindahSchema }),
  pindah
);

defineRoute(
  router,
  {
    method: 'patch',
    path: '/rawat-inap/:id/pulang',
    auth: true,
    profiles: KLINIS,
    schemas: { params: idParams, body: pulangSchema }
  },
  authenticate,
  requireProfiles(...KLINIS),
  validate({ params: idParams, body: pulangSchema }),
  pulang
);

defineRoute(
  router,
  {
    method: 'post',
    path: '/kunjungan/:id/visite',
    auth: true,
    profiles: KLINIS,
    schemas: { params: idParams, body: visiteSchema }
  },
  authenticate,
  requireProfiles(...KLINIS),
  validate({ params: idParams, body: visiteSchema }),
  visite
);

defineRoute(
  router,
  {
    method: 'post',
    path: '/kunjungan/:id/triase',
    auth: true,
    profiles: KLINIS,
    schemas: { params: idParams, body: triaseSchema }
  },
  authenticate,
  requireProfiles(...KLINIS),
  validate({ params: idParams, body: triaseSchema }),
  triase
);

defineRoute(
  router,
  {
    method: 'post',
    path: '/igd/antrean/list',
    auth: true,
    profiles: KLINIS,
    schemas: { body: emptyBodySchema }
  },
  authenticate,
  requireProfiles(...KLINIS),
  validate({ body: emptyBodySchema }),
  listIgdAntrean
);

defineRoute(
  router,
  {
    method: 'post',
    path: '/operasi/list',
    auth: true,
    profiles: OPERASI_LIST,
    schemas: { body: ranapListSchema }
  },
  authenticate,
  requireProfiles(...OPERASI_LIST),
  validate({ body: ranapListSchema }),
  listOperasi
);

defineRoute(
  router,
  {
    method: 'post',
    path: '/kunjungan/:id/operasi',
    auth: true,
    profiles: DOKTER,
    schemas: { params: idParams, body: operasiSchema }
  },
  authenticate,
  requireProfiles(...DOKTER),
  validate({ params: idParams, body: operasiSchema }),
  createOperasi
);

defineRoute(
  router,
  {
    method: 'patch',
    path: '/operasi/:id',
    auth: true,
    profiles: KLINIS,
    schemas: { params: idParams, body: operasiUpdateSchema }
  },
  authenticate,
  requireProfiles(...KLINIS),
  validate({ params: idParams, body: operasiUpdateSchema }),
  updateOperasi
);

defineRoute(
  router,
  {
    method: 'post',
    path: '/ambulans/list',
    auth: true,
    profiles: AMBULANS_BACA,
    schemas: { body: emptyBodySchema }
  },
  authenticate,
  requireProfiles(...AMBULANS_BACA),
  validate({ body: emptyBodySchema }),
  listAmbulans
);

defineRoute(
  router,
  {
    method: 'post',
    path: '/ambulans',
    auth: true,
    profiles: ADMIN_LOKAL,
    schemas: { body: ambulansSchema }
  },
  authenticate,
  requireProfiles(...ADMIN_LOKAL),
  validate({ body: ambulansSchema }),
  createAmbulans
);

defineRoute(
  router,
  {
    method: 'post',
    path: '/ambulans/:id/perjalanan',
    auth: true,
    profiles: AMBULANS_PERJALANAN,
    schemas: { params: idParams, body: perjalananSchema }
  },
  authenticate,
  requireProfiles(...AMBULANS_PERJALANAN),
  validate({ params: idParams, body: perjalananSchema }),
  createPerjalanan
);

defineRoute(
  router,
  {
    method: 'post',
    path: '/ambulans/perjalanan/list',
    auth: true,
    profiles: AMBULANS_PERJALANAN,
    schemas: { body: ranapListSchema }
  },
  authenticate,
  requireProfiles(...AMBULANS_PERJALANAN),
  validate({ body: ranapListSchema }),
  listPerjalanan
);

export default router;
