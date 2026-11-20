import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireProfiles } from '../middleware/rbac';
import { asyncHandler } from '../middleware/asyncHandler';
import { validate } from '../routes/v1/_validate';
import { defineRoute } from '../routes/v1/_registry';
import { idParams } from '../validation/common';
import {
  createMasterSchema,
  masterListSchema,
  updateMasterSchema,
  type MasterDefinition
} from '../validation/master';
import { MasterService } from '../services/master.service';
import respond from '../http/respond';

export const buildMasterRouter = (definitions: readonly MasterDefinition[]): Router => {
  const router = Router();

  for (const definition of definitions) {
    const service = new MasterService(definition);
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
      asyncHandler(async (req, res) => {
        const { limit, offset } = (req.validated?.body ?? {}) as { limit?: number; offset?: number };
        return respond.ok(res, await service.list(limit, offset));
      })
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
        asyncHandler(async (req, res) => {
          const row = await service.create((req.validated?.body ?? {}) as Record<string, unknown>);
          return respond.created(res, row);
        })
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
        asyncHandler(async (req, res) => {
          const { id } = req.validated?.params as { id: string };
          const row = await service.update(id, (req.validated?.body ?? {}) as Record<string, unknown>);
          return respond.ok(res, row);
        })
      );
    }
  }

  return router;
};

export default buildMasterRouter;
