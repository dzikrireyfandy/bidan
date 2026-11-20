import { asyncHandler } from '../middleware/asyncHandler';
import respond from '../http/respond';
import { PasienService } from '../services/pasien.service';
import type {
  AlergiBody,
  AlergiUpdateBody,
  KonfirmasiRedFlagBody,
  PasienSearchInput,
  WalkInBody
} from '../validation/pasien';

const service = new PasienService();

export const listIdentitas = asyncHandler(async (req, res) => {
  const body = req.validated?.body as PasienSearchInput;
  return respond.ok(res, await service.listIdentitas(body.limit, body.q));
});

export const walkIn = asyncHandler(async (req, res) => {
  const body = req.validated?.body as WalkInBody;
  return respond.created(res, await service.walkIn(body));
});

export const listPasien = asyncHandler(async (req, res) => {
  const body = req.validated?.body as PasienSearchInput;
  return respond.ok(res, await service.list(body.limit, body.q));
});

export const rmeDetail = asyncHandler(async (req, res) => {
  const { id } = req.validated?.params as { id: string };
  return respond.ok(res, await service.rmeDetail(id));
});

export const addAlergi = asyncHandler(async (req, res) => {
  const { id } = req.validated?.params as { id: string };
  const body = req.validated?.body as AlergiBody;
  return respond.created(res, await service.addAlergi(id, body, req.auth?.stafId ?? null));
});

export const updateAlergi = asyncHandler(async (req, res) => {
  const { id } = req.validated?.params as { id: string };
  const body = req.validated?.body as AlergiUpdateBody;
  return respond.ok(res, await service.updateAlergi(id, body));
});

export const konfirmasiRedFlag = asyncHandler(async (req, res) => {
  const { id } = req.validated?.params as { id: string };
  const body = req.validated?.body as KonfirmasiRedFlagBody;
  return respond.ok(res, await service.konfirmasiRedFlag(id, body, req.auth));
});

export const exportRme = asyncHandler(async (req, res) => {
  const { id } = req.validated?.params as { id: string };
  return respond.ok(res, await service.exportRme(id));
});

export default {
  listIdentitas,
  walkIn,
  listPasien,
  rmeDetail,
  addAlergi,
  updateAlergi,
  konfirmasiRedFlag,
  exportRme
};
