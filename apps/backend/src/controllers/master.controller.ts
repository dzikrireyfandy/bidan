import { RequestHandler } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import respond from '../http/respond';
import type { MasterService } from '../services/master.service';

export interface MasterHandlers {
  list: RequestHandler;
  create: RequestHandler;
  update: RequestHandler;
}

/**
 * Handler tipis untuk seluruh endpoint master generik.
 * Tidak ada akses route/DB di sini; service yang menyimpan aturan bisnis.
 */
export const createMasterHandlers = (service: MasterService): MasterHandlers => ({
  list: asyncHandler(async (req, res) => {
    const { limit, offset } = (req.validated?.body ?? {}) as { limit?: number; offset?: number };
    return respond.ok(res, await service.list(limit, offset));
  }),
  create: asyncHandler(async (req, res) => {
    const row = await service.create((req.validated?.body ?? {}) as Record<string, unknown>);
    return respond.created(res, row);
  }),
  update: asyncHandler(async (req, res) => {
    const { id } = req.validated?.params as { id: string };
    const row = await service.update(id, (req.validated?.body ?? {}) as Record<string, unknown>);
    return respond.ok(res, row);
  })
});

export default createMasterHandlers;
