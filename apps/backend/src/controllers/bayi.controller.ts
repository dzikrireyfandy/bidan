import { asyncHandler } from '../middleware/asyncHandler';
import respond from '../http/respond';
import { BayiService } from '../services/bayi.service';
import type { AsuhanBody, PemeriksaanBody } from '../validation/bayi';

const service = new BayiService();

export const createAsuhan = asyncHandler(async (req, res) => {
  const { id } = req.validated?.params as { id: string };
  const body = req.validated?.body as AsuhanBody;
  return respond.created(res, await service.createAsuhan(id, body, req.auth?.stafId ?? null));
});

export const listAsuhan = asyncHandler(async (req, res) => {
  const { id } = req.validated?.params as { id: string };
  return respond.ok(res, await service.listAsuhan(id));
});

export const createPemeriksaan = asyncHandler(async (req, res) => {
  const { id } = req.validated?.params as { id: string };
  const body = req.validated?.body as PemeriksaanBody;
  return respond.created(res, await service.createPemeriksaan(id, body, req.auth?.stafId ?? null));
});

export const listPemeriksaan = asyncHandler(async (req, res) => {
  const { id } = req.validated?.params as { id: string };
  return respond.ok(res, await service.listPemeriksaan(id));
});

export const grafik = asyncHandler(async (req, res) => {
  const { id } = req.validated?.params as { id: string };
  return respond.ok(res, await service.grafik(id));
});

export default {
  createAsuhan,
  listAsuhan,
  createPemeriksaan,
  listPemeriksaan,
  grafik
};
