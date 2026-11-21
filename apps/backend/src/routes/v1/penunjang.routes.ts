import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireProfiles } from '../../middleware/rbac';
import { validate } from './_validate';
import { defineRoute } from './_registry';
import { emptyBodySchema, idParams } from '../../validation/common';
import { DOKTER, KLINIS } from '../../auth/profiles';
import { hasilLabSchema, hasilRadSchema, orderSchema } from '../../validation/penunjang';
import {
  createHasilLab,
  createHasilRadiologi,
  createOrder,
  listOrder
} from '../../controllers/penunjang.controller';

const router = Router();

defineRoute(
  router,
  {
    method: 'post',
    path: '/kunjungan/:id/order-penunjang',
    auth: true,
    profiles: DOKTER,
    schemas: { params: idParams, body: orderSchema }
  },
  authenticate,
  requireProfiles(...DOKTER),
  validate({ params: idParams, body: orderSchema }),
  createOrder
);

defineRoute(
  router,
  {
    method: 'post',
    path: '/kunjungan/:id/order/list',
    auth: true,
    profiles: KLINIS,
    schemas: { params: idParams, body: emptyBodySchema }
  },
  authenticate,
  requireProfiles(...KLINIS),
  validate({ params: idParams, body: emptyBodySchema }),
  listOrder
);

defineRoute(
  router,
  {
    method: 'post',
    path: '/order/:id/hasil-lab',
    auth: true,
    profiles: KLINIS,
    schemas: { params: idParams, body: hasilLabSchema }
  },
  authenticate,
  requireProfiles(...KLINIS),
  validate({ params: idParams, body: hasilLabSchema }),
  createHasilLab
);

defineRoute(
  router,
  {
    method: 'post',
    path: '/order/:id/hasil-radiologi',
    auth: true,
    profiles: KLINIS,
    schemas: { params: idParams, body: hasilRadSchema }
  },
  authenticate,
  requireProfiles(...KLINIS),
  validate({ params: idParams, body: hasilRadSchema }),
  createHasilRadiologi
);

export default router;
