import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireProfiles } from '../../middleware/rbac';
import { validate } from './_validate';
import { defineRoute } from './_registry';
import { emptyBodySchema, idParams } from '../../validation/common';
import { KLINIS } from '../../auth/profiles';
import { asuhanSchema, pemeriksaanSchema } from '../../validation/bayi';
import {
  createAsuhan,
  createPemeriksaan,
  grafik,
  listAsuhan,
  listPemeriksaan
} from '../../controllers/bayi.controller';

const router = Router();

defineRoute(
  router,
  {
    method: 'post',
    path: '/bayi/:id/asuhan-bbl',
    auth: true,
    profiles: KLINIS,
    schemas: { params: idParams, body: asuhanSchema }
  },
  authenticate,
  requireProfiles(...KLINIS),
  validate({ params: idParams, body: asuhanSchema }),
  createAsuhan
);

defineRoute(
  router,
  {
    method: 'post',
    path: '/bayi/:id/asuhan-bbl/list',
    auth: true,
    profiles: KLINIS,
    schemas: { params: idParams, body: emptyBodySchema }
  },
  authenticate,
  requireProfiles(...KLINIS),
  validate({ params: idParams, body: emptyBodySchema }),
  listAsuhan
);

defineRoute(
  router,
  {
    method: 'post',
    path: '/bayi/:id/pemeriksaan',
    auth: true,
    profiles: KLINIS,
    schemas: { params: idParams, body: pemeriksaanSchema }
  },
  authenticate,
  requireProfiles(...KLINIS),
  validate({ params: idParams, body: pemeriksaanSchema }),
  createPemeriksaan
);

defineRoute(
  router,
  {
    method: 'post',
    path: '/bayi/:id/pemeriksaan/list',
    auth: true,
    profiles: KLINIS,
    schemas: { params: idParams, body: emptyBodySchema }
  },
  authenticate,
  requireProfiles(...KLINIS),
  validate({ params: idParams, body: emptyBodySchema }),
  listPemeriksaan
);

defineRoute(
  router,
  {
    method: 'post',
    path: '/bayi/:id/tumbuh-kembang/grafik',
    auth: true,
    profiles: KLINIS,
    schemas: { params: idParams, body: emptyBodySchema }
  },
  authenticate,
  requireProfiles(...KLINIS),
  validate({ params: idParams, body: emptyBodySchema }),
  grafik
);

export default router;
