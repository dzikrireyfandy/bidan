import { asyncHandler } from '../middleware/asyncHandler';
import respond from '../http/respond';
import { AdminService } from '../services/admin.service';
import type { AkunBody, PemeliharaanBody } from '../validation/admin';

const service = new AdminService();

export const createAkun = asyncHandler(async (req, res) => {
  const { id } = req.validated?.params as { id: string };
  const body = req.validated?.body as AkunBody;
  return respond.created(res, await service.createAkun(id, body));
});

export const createPemeliharaan = asyncHandler(async (req, res) => {
  const { id } = req.validated?.params as { id: string };
  const body = req.validated?.body as PemeliharaanBody;
  return respond.created(res, await service.createPemeliharaan(id, body));
});

export default {
  createAkun,
  createPemeliharaan
};
