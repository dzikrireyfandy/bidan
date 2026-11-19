import { Router } from 'express';
import { z } from 'zod';
import db from '../../db/pool';
import ApiError from '../../errors/ApiError';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import type { Peran } from '../../types';
import { parseBody, paginate } from './_validate';

export interface CrudRoute {
  path: string;
  table: string;
  pk: string;
  columns: readonly string[];
  read: readonly Peran[];
  write: readonly Peran[];
  create?: boolean;
  update?: boolean;
  orderBy?: string;
}

const listSchema = z.object({
  limit: z.number().int().min(1).max(500).optional(),
  offset: z.number().int().min(0).optional()
});

const bodySchema = z.record(z.string(), z.unknown());

const pick = (body: Record<string, unknown>, columns: readonly string[]): Record<string, unknown> => {
  const values: Record<string, unknown> = {};
  for (const column of columns) {
    if (body[column] !== undefined) {
      values[column] = body[column];
    }
  }
  return values;
};

export const buildCrudRouter = (routes: readonly CrudRoute[]): Router => {
  const router = Router();

  for (const route of routes) {
    const guard = requireRole(...route.read);

    router.post(
      `${route.path}/list`,
      authenticate,
      guard,
      asyncHandler(async (req, res) => {
        const { limit, offset } = parseBody(listSchema, req.body ?? {});
        const order = route.orderBy ?? route.pk;
        const result = await db.query<Record<string, unknown>>(
          `SELECT * FROM ${route.table} ORDER BY ${order} OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
          { offset: offset ?? 0, limit: paginate(limit, 100, 500) }
        );
        res.status(200).json({ success: true, data: result.recordset });
      })
    );

    if (route.create !== false) {
      router.post(
        route.path,
        authenticate,
        requireRole(...route.write),
        asyncHandler(async (req, res) => {
          const body = parseBody(bodySchema, req.body ?? {});
          const values = pick(body, route.columns);
          const keys = Object.keys(values);
          if (keys.length === 0) {
            throw ApiError.badRequest('Body tidak berisi kolom yang valid');
          }
          const columns = keys.join(', ');
          const params = keys.map((key) => `@${key}`).join(', ');
          const result = await db.query<Record<string, unknown>>(
            `INSERT INTO ${route.table} (${columns}) OUTPUT INSERTED.* VALUES (${params})`,
            values
          );
          res.status(201).json({ success: true, data: result.recordset[0] });
        })
      );
    }

    if (route.update !== false) {
      router.patch(
        `${route.path}/:id`,
        authenticate,
        requireRole(...route.write),
        asyncHandler(async (req, res) => {
          const body = parseBody(bodySchema, req.body ?? {});
          const values = pick(body, route.columns);
          const keys = Object.keys(values);
          if (keys.length === 0) {
            throw ApiError.badRequest('Body tidak berisi kolom yang valid');
          }
          const assignments = keys.map((key) => `${key} = @${key}`).join(', ');
          const result = await db.query<Record<string, unknown>>(
            `UPDATE ${route.table} SET ${assignments} OUTPUT INSERTED.* WHERE ${route.pk} = @id`,
            { ...values, id: req.params['id'] }
          );
          const updated = result.recordset[0];
          if (!updated) {
            throw ApiError.notFound('Data tidak ditemukan');
          }
          res.status(200).json({ success: true, data: updated });
        })
      );
    }
  }

  return router;
};

export default buildCrudRouter;
