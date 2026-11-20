import { asyncHandler } from '../middleware/asyncHandler';
import respond from '../http/respond';
import { PenunjangService } from '../services/penunjang.service';
import type { HasilLabBody, HasilRadBody, OrderBody } from '../validation/penunjang';

const service = new PenunjangService();

export const createOrder = asyncHandler(async (req, res) => {
  const { id } = req.validated?.params as { id: string };
  const body = req.validated?.body as OrderBody;
  return respond.created(res, await service.createOrder(id, body, req.auth?.stafId ?? null));
});

export const listOrder = asyncHandler(async (req, res) => {
  const { id } = req.validated?.params as { id: string };
  return respond.ok(res, await service.listOrder(id));
});

export const createHasilLab = asyncHandler(async (req, res) => {
  const body = req.validated?.body as HasilLabBody;
  return respond.created(res, await service.createHasilLab(body, req.auth?.stafId ?? null));
});

export const createHasilRadiologi = asyncHandler(async (req, res) => {
  const body = req.validated?.body as HasilRadBody;
  return respond.created(res, await service.createHasilRadiologi(body, req.auth?.stafId ?? null));
});

export default {
  createOrder,
  listOrder,
  createHasilLab,
  createHasilRadiologi
};
