import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireProfiles } from '../../middleware/rbac';
import { validate } from './_validate';
import { defineRoute } from './_registry';
import { emptyBodySchema, idParams } from '../../validation/common';
import { ADMIN_LOKAL, P } from '../../auth/profiles';
import {
  batchSchema,
  obatSchema,
  obatUpdateSchema,
  resepPengeluaranSchema,
  restockSchema,
  stokListSchema
} from '../../validation/inventaris';
import {
  createBatch,
  createObat,
  list,
  listBatch,
  listGudang,
  listRiwayat,
  listStokGudang,
  pengeluaranResep,
  restock,
  updateObat
} from '../../controllers/inventaris.controller';

const router = Router();

const STOK_BACA = [P.SUPERADMIN, P.ADMIN_LOKAL, P.DOKTER, P.PERAWAT];
const PERSEDIAAN = [P.SUPERADMIN, P.ADMIN_LOKAL, P.PERAWAT];

const registerDaftarObat = (path: string): void => {
  defineRoute(
    router,
    { method: 'post', path, auth: true, profiles: STOK_BACA, schemas: { body: stokListSchema } },
    authenticate,
    requireProfiles(...STOK_BACA),
    validate({ body: stokListSchema }),
    list
  );
};

const registerBuatObat = (path: string): void => {
  defineRoute(
    router,
    { method: 'post', path, auth: true, profiles: ADMIN_LOKAL, schemas: { body: obatSchema } },
    authenticate,
    requireProfiles(...ADMIN_LOKAL),
    validate({ body: obatSchema }),
    createObat
  );
};

const registerUbahObat = (path: string): void => {
  defineRoute(
    router,
    {
      method: 'patch',
      path,
      auth: true,
      profiles: ADMIN_LOKAL,
      schemas: { params: idParams, body: obatUpdateSchema }
    },
    authenticate,
    requireProfiles(...ADMIN_LOKAL),
    validate({ params: idParams, body: obatUpdateSchema }),
    updateObat
  );
};

registerDaftarObat('/inventaris/list');
registerBuatObat('/inventaris');
registerUbahObat('/inventaris/:id');
registerDaftarObat('/obat/list');
registerBuatObat('/obat');
registerUbahObat('/obat/:id');

defineRoute(
  router,
  {
    method: 'post',
    path: '/inventaris/:id/restock',
    auth: true,
    profiles: ADMIN_LOKAL,
    schemas: { params: idParams, body: restockSchema }
  },
  authenticate,
  requireProfiles(...ADMIN_LOKAL),
  validate({ params: idParams, body: restockSchema }),
  restock
);

defineRoute(
  router,
  {
    method: 'post',
    path: '/inventaris/:id/riwayat/list',
    auth: true,
    profiles: ADMIN_LOKAL,
    schemas: { params: idParams, body: stokListSchema }
  },
  authenticate,
  requireProfiles(...ADMIN_LOKAL),
  validate({ params: idParams, body: stokListSchema }),
  listRiwayat
);

defineRoute(
  router,
  {
    method: 'post',
    path: '/obat/:id/batch/list',
    auth: true,
    profiles: PERSEDIAAN,
    schemas: { params: idParams, body: emptyBodySchema }
  },
  authenticate,
  requireProfiles(...PERSEDIAAN),
  validate({ params: idParams, body: emptyBodySchema }),
  listBatch
);

defineRoute(
  router,
  {
    method: 'post',
    path: '/obat/:id/batch',
    auth: true,
    profiles: ADMIN_LOKAL,
    schemas: { params: idParams, body: batchSchema }
  },
  authenticate,
  requireProfiles(...ADMIN_LOKAL),
  validate({ params: idParams, body: batchSchema }),
  createBatch
);

defineRoute(
  router,
  {
    method: 'post',
    path: '/gudang/list',
    auth: true,
    profiles: PERSEDIAAN,
    schemas: { body: emptyBodySchema }
  },
  authenticate,
  requireProfiles(...PERSEDIAAN),
  validate({ body: emptyBodySchema }),
  listGudang
);

defineRoute(
  router,
  {
    method: 'post',
    path: '/gudang/:id/stok/list',
    auth: true,
    profiles: PERSEDIAAN,
    schemas: { params: idParams, body: emptyBodySchema }
  },
  authenticate,
  requireProfiles(...PERSEDIAAN),
  validate({ params: idParams, body: emptyBodySchema }),
  listStokGudang
);

defineRoute(
  router,
  {
    method: 'post',
    path: '/resep/:id/pengeluaran',
    auth: true,
    profiles: PERSEDIAAN,
    schemas: { params: idParams, body: resepPengeluaranSchema }
  },
  authenticate,
  requireProfiles(...PERSEDIAAN),
  validate({ params: idParams, body: resepPengeluaranSchema }),
  pengeluaranResep
);

export default router;
