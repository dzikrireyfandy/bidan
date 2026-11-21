import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireProfiles } from '../../middleware/rbac';
import { validate } from './_validate';
import { defineRoute } from './_registry';
import { idParams } from '../../validation/common';
import {
  alergiSchema,
  alergiUpdateSchema,
  konfirmasiRedFlagSchema,
  pasienSearchSchema,
  walkInSchema
} from '../../validation/pasien';
import { P, SEMUA_STAF } from '../../auth/profiles';
import {
  addAlergi,
  exportRme,
  konfirmasiRedFlag,
  listIdentitas,
  listPasien,
  rmeDetail,
  updateAlergi,
  walkIn
} from '../../controllers/pasien.controller';

const router = Router();

const PERAWAT_KLINIS = [P.SUPERADMIN, P.DOKTER, P.PERAWAT];

defineRoute(
  router,
  {
    method: 'post',
    path: '/pasien/identitas/list',
    auth: true,
    profiles: SEMUA_STAF,
    schemas: { body: pasienSearchSchema }
  },
  authenticate,
  requireProfiles(...SEMUA_STAF),
  validate({ body: pasienSearchSchema }),
  listIdentitas
);

defineRoute(
  router,
  {
    method: 'post',
    path: '/pasien/walk-in',
    auth: true,
    profiles: [P.SUPERADMIN, P.ADMIN_LOKAL, P.RESEPSIONIS],
    schemas: { body: walkInSchema }
  },
  authenticate,
  requireProfiles(P.SUPERADMIN, P.ADMIN_LOKAL, P.RESEPSIONIS),
  validate({ body: walkInSchema }),
  walkIn
);

defineRoute(
  router,
  {
    method: 'post',
    path: '/pasien/list',
    auth: true,
    profiles: PERAWAT_KLINIS,
    schemas: { body: pasienSearchSchema }
  },
  authenticate,
  requireProfiles(...PERAWAT_KLINIS),
  validate({ body: pasienSearchSchema }),
  listPasien
);

defineRoute(
  router,
  {
    method: 'post',
    path: '/pasien/:id/rme/detail',
    auth: true,
    profiles: PERAWAT_KLINIS,
    schemas: { params: idParams }
  },
  authenticate,
  requireProfiles(...PERAWAT_KLINIS),
  validate({ params: idParams }),
  rmeDetail
);

defineRoute(
  router,
  {
    method: 'post',
    path: '/pasien/:id/alergi',
    auth: true,
    profiles: PERAWAT_KLINIS,
    schemas: { params: idParams, body: alergiSchema }
  },
  authenticate,
  requireProfiles(...PERAWAT_KLINIS),
  validate({ params: idParams, body: alergiSchema }),
  addAlergi
);

defineRoute(
  router,
  {
    method: 'patch',
    path: '/alergi/:id',
    auth: true,
    profiles: [P.SUPERADMIN, P.DOKTER],
    schemas: { params: idParams, body: alergiUpdateSchema }
  },
  authenticate,
  requireProfiles(P.SUPERADMIN, P.DOKTER),
  validate({ params: idParams, body: alergiUpdateSchema }),
  updateAlergi
);

defineRoute(
  router,
  {
    method: 'post',
    path: '/pasien/:id/red-flag/konfirmasi',
    auth: true,
    profiles: PERAWAT_KLINIS,
    schemas: { params: idParams, body: konfirmasiRedFlagSchema }
  },
  authenticate,
  requireProfiles(...PERAWAT_KLINIS),
  validate({ params: idParams, body: konfirmasiRedFlagSchema }),
  konfirmasiRedFlag
);

defineRoute(
  router,
  {
    method: 'post',
    path: '/pasien/:id/rme/export',
    auth: true,
    profiles: [P.SUPERADMIN, P.DOKTER],
    schemas: { params: idParams }
  },
  authenticate,
  requireProfiles(P.SUPERADMIN, P.DOKTER),
  validate({ params: idParams }),
  exportRme
);

export default router;
