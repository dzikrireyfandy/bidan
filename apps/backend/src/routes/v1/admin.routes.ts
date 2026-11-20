import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireProfiles } from '../../middleware/rbac';
import { validate } from './_validate';
import { defineRoute } from './_registry';
import { idParams } from '../../validation/common';
import { ADMIN_LOKAL, P } from '../../auth/profiles';
import { akunSchema, pemeliharaanSchema } from '../../validation/admin';
import { createAkun, createPemeliharaan } from '../../controllers/admin.controller';

const router = Router();

const SUPERADMIN = [P.SUPERADMIN];

defineRoute(
  router,
  {
    method: 'post',
    path: '/staf/:id/akun',
    auth: true,
    profiles: SUPERADMIN,
    schemas: { params: idParams, body: akunSchema }
  },
  authenticate,
  requireProfiles(...SUPERADMIN),
  validate({ params: idParams, body: akunSchema }),
  createAkun
);

defineRoute(
  router,
  {
    method: 'post',
    path: '/aset/:id/pemeliharaan',
    auth: true,
    profiles: ADMIN_LOKAL,
    schemas: { params: idParams, body: pemeliharaanSchema }
  },
  authenticate,
  requireProfiles(...ADMIN_LOKAL),
  validate({ params: idParams, body: pemeliharaanSchema }),
  createPemeliharaan
);

export default router;
