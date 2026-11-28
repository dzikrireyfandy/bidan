import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireProfiles } from '../../middleware/rbac';
import { validate } from './_validate';
import { defineRoute } from './_registry';
import { SEMUA_STAF } from '../../auth/profiles';
import { dashboardInternalSchema } from '../../validation/dashboard';
import { internalDashboard } from '../../controllers/dashboard.controller';

const router = Router();

defineRoute(
  router,
  {
    method: 'post',
    path: '/dashboard/internal/list',
    auth: true,
    profiles: SEMUA_STAF,
    schemas: { body: dashboardInternalSchema }
  },
  authenticate,
  requireProfiles(...SEMUA_STAF),
  validate({ body: dashboardInternalSchema }),
  internalDashboard
);

export default router;
