import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireProfiles } from '../../middleware/rbac';
import { validate } from './_validate';
import { defineRoute } from './_registry';
import { idParams } from '../../validation/common';
import { ADMIN_LOKAL, P, SEMUA_STAF } from '../../auth/profiles';
import {
  jadwalSchema,
  jadwalUpdateSchema,
  jadwalUlangSchema,
  reservasiListSchema,
  statusSchema
} from '../../validation/reservasi';
import {
  cancelReservasi,
  createJadwal,
  listJadwal,
  listReservasi,
  reschedule,
  updateJadwal,
  updateStatus
} from '../../controllers/reservasi.controller';

const router = Router();

const FRONT_OFFICE = [P.SUPERADMIN, P.ADMIN_LOKAL, P.RESEPSIONIS];
const STATUS_ROLES = [P.SUPERADMIN, P.DOKTER, P.PERAWAT, P.RESEPSIONIS];

const registerJadwalList = (path: string): void => {
  defineRoute(
    router,
    { method: 'post', path, auth: true, profiles: SEMUA_STAF, schemas: { body: reservasiListSchema } },
    authenticate,
    requireProfiles(...SEMUA_STAF),
    validate({ body: reservasiListSchema }),
    listJadwal
  );
};

const registerJadwalCreate = (path: string): void => {
  defineRoute(
    router,
    { method: 'post', path, auth: true, profiles: ADMIN_LOKAL, schemas: { body: jadwalSchema } },
    authenticate,
    requireProfiles(...ADMIN_LOKAL),
    validate({ body: jadwalSchema }),
    createJadwal
  );
};

const registerJadwalUpdate = (path: string): void => {
  defineRoute(
    router,
    {
      method: 'patch',
      path,
      auth: true,
      profiles: ADMIN_LOKAL,
      schemas: { params: idParams, body: jadwalUpdateSchema }
    },
    authenticate,
    requireProfiles(...ADMIN_LOKAL),
    validate({ params: idParams, body: jadwalUpdateSchema }),
    updateJadwal
  );
};

defineRoute(
  router,
  {
    method: 'post',
    path: '/reservasi/list',
    auth: true,
    profiles: SEMUA_STAF,
    schemas: { body: reservasiListSchema }
  },
  authenticate,
  requireProfiles(...SEMUA_STAF),
  validate({ body: reservasiListSchema }),
  listReservasi
);

defineRoute(
  router,
  {
    method: 'patch',
    path: '/reservasi/:id/jadwal',
    auth: true,
    profiles: FRONT_OFFICE,
    schemas: { params: idParams, body: jadwalUlangSchema }
  },
  authenticate,
  requireProfiles(...FRONT_OFFICE),
  validate({ params: idParams, body: jadwalUlangSchema }),
  reschedule
);

defineRoute(
  router,
  {
    method: 'patch',
    path: '/reservasi/:id/batal',
    auth: true,
    profiles: FRONT_OFFICE,
    schemas: { params: idParams }
  },
  authenticate,
  requireProfiles(...FRONT_OFFICE),
  validate({ params: idParams }),
  cancelReservasi
);

defineRoute(
  router,
  {
    method: 'patch',
    path: '/reservasi/:id/status',
    auth: true,
    profiles: STATUS_ROLES,
    schemas: { params: idParams, body: statusSchema }
  },
  authenticate,
  requireProfiles(...STATUS_ROLES),
  validate({ params: idParams, body: statusSchema }),
  updateStatus
);

registerJadwalList('/jadwal-praktik/list');
registerJadwalCreate('/jadwal-praktik');
registerJadwalUpdate('/jadwal-praktik/:id');

registerJadwalList('/sesi/list');
registerJadwalCreate('/sesi');
registerJadwalUpdate('/sesi/:id');

export default router;
