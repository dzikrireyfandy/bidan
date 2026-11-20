import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireProfiles } from '../../middleware/rbac';
import { validate } from './_validate';
import { defineRoute } from './_registry';
import { idParams } from '../../validation/common';
import {
  MASTER_DEFINITIONS,
  createMasterSchema,
  masterListSchema,
  updateMasterSchema
} from '../../validation/master';
import { MasterService } from '../../services/master.service';
import { createMasterHandlers } from '../../controllers/master.controller';

const router = Router();

for (const definition of MASTER_DEFINITIONS) {
  const service = new MasterService(definition);
  const handlers = createMasterHandlers(service);
  const createSchema = createMasterSchema(definition);
  const updateSchema = updateMasterSchema(definition);

  defineRoute(
    router,
    {
      method: 'post',
      path: `${definition.path}/list`,
      auth: true,
      profiles: definition.read,
      schemas: { body: masterListSchema }
    },
    authenticate,
    requireProfiles(...definition.read),
    validate({ body: masterListSchema }),
    handlers.list
  );

  if (definition.create) {
    defineRoute(
      router,
      {
        method: 'post',
        path: definition.path,
        auth: true,
        profiles: definition.create,
        schemas: { body: createSchema }
      },
      authenticate,
      requireProfiles(...definition.create),
      validate({ body: createSchema }),
      handlers.create
    );
  }

  if (definition.update) {
    defineRoute(
      router,
      {
        method: 'patch',
        path: `${definition.path}/:id`,
        auth: true,
        profiles: definition.update,
        schemas: { body: updateSchema, params: idParams }
      },
      authenticate,
      requireProfiles(...definition.update),
      validate({ params: idParams, body: updateSchema }),
      handlers.update
    );
  }
}

export default router;
