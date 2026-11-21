import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireProfiles } from '../../middleware/rbac';
import { validate } from './_validate';
import { defineRoute } from './_registry';
import { SEMUA_AUTH } from '../../auth/profiles';
import {
  emailSchema,
  emptyBodySchema,
  loginSchema,
  resetVerifySchema
} from '../../validation/auth';
import {
  login,
  logout,
  refresh,
  requestReset,
  verifyReset
} from '../../controllers/auth.controller';

const router = Router();

defineRoute(
  router,
  { method: 'post', path: '/auth/login', auth: false, profiles: [], schemas: { body: loginSchema } },
  validate({ body: loginSchema }),
  login
);

defineRoute(
  router,
  {
    method: 'post',
    path: '/auth/logout',
    auth: true,
    profiles: SEMUA_AUTH,
    schemas: { body: emptyBodySchema }
  },
  authenticate,
  requireProfiles(...SEMUA_AUTH),
  validate({ body: emptyBodySchema }),
  logout
);

defineRoute(
  router,
  {
    method: 'post',
    path: '/auth/refresh',
    auth: true,
    profiles: SEMUA_AUTH,
    schemas: { body: emptyBodySchema }
  },
  authenticate,
  requireProfiles(...SEMUA_AUTH),
  validate({ body: emptyBodySchema }),
  refresh
);

defineRoute(
  router,
  {
    method: 'post',
    path: '/auth/reset/request',
    auth: false,
    profiles: [],
    schemas: { body: emailSchema }
  },
  validate({ body: emailSchema }),
  requestReset
);

defineRoute(
  router,
  {
    method: 'post',
    path: '/auth/reset/verify',
    auth: false,
    profiles: [],
    schemas: { body: resetVerifySchema }
  },
  validate({ body: resetVerifySchema }),
  verifyReset
);

export default router;
