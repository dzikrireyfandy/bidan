import { asyncHandler } from '../middleware/asyncHandler';
import respond from '../http/respond';
import { KlinisService } from '../services/klinis.service';
import type {
  AncBody,
  CatatanBody,
  ImunisasiBody,
  KbBody,
  KehamilanBody,
  KlinisBayiBody,
  KunjunganBody,
  LimitInput,
  PersalinanBody,
  RmeListInput,
  RmeSimpanInput
} from '../validation/klinis';

const service = new KlinisService();

export const createKunjungan = asyncHandler(async (req, res) => {
  const { id } = req.validated?.params as { id: string };
  const body = req.validated?.body as KunjunganBody;
  return respond.created(res, await service.createKunjungan(id, body, req.auth));
});

export const createCatatan = asyncHandler(async (req, res) => {
  const { id } = req.validated?.params as { id: string };
  const body = req.validated?.body as CatatanBody;
  return respond.created(res, await service.createCatatan(id, body, req.auth?.stafId ?? null));
});

export const listKehamilan = asyncHandler(async (req, res) => {
  const { id } = req.validated?.params as { id: string };
  const body = req.validated?.body as LimitInput;
  return respond.ok(res, await service.listKehamilan(id, body));
});

export const createKehamilan = asyncHandler(async (req, res) => {
  const { id } = req.validated?.params as { id: string };
  const body = req.validated?.body as KehamilanBody;
  return respond.created(res, await service.createKehamilan(id, body));
});

export const listAnc = asyncHandler(async (req, res) => {
  const { id } = req.validated?.params as { id: string };
  const body = req.validated?.body as LimitInput;
  return respond.ok(res, await service.listAnc(id, body));
});

export const createAnc = asyncHandler(async (req, res) => {
  const { id } = req.validated?.params as { id: string };
  const body = req.validated?.body as AncBody;
  return respond.created(res, await service.createAnc(id, body));
});

export const createPersalinan = asyncHandler(async (req, res) => {
  const { id } = req.validated?.params as { id: string };
  const body = req.validated?.body as PersalinanBody;
  return respond.created(res, await service.createPersalinan(id, body, req.auth));
});

export const createBayi = asyncHandler(async (req, res) => {
  const { id } = req.validated?.params as { id: string };
  const body = req.validated?.body as KlinisBayiBody;
  return respond.created(res, await service.createBayi(id, body));
});

export const listImunisasi = asyncHandler(async (req, res) => {
  const { id } = req.validated?.params as { id: string };
  const body = req.validated?.body as LimitInput;
  return respond.ok(res, await service.listImunisasi(id, body));
});

export const createImunisasi = asyncHandler(async (req, res) => {
  const { id } = req.validated?.params as { id: string };
  const body = req.validated?.body as ImunisasiBody;
  return respond.created(res, await service.createImunisasi(id, body, req.auth?.stafId ?? null));
});

export const listKb = asyncHandler(async (req, res) => {
  const { id } = req.validated?.params as { id: string };
  const body = req.validated?.body as LimitInput;
  return respond.ok(res, await service.listKb(id, body));
});

export const createKb = asyncHandler(async (req, res) => {
  const { id } = req.validated?.params as { id: string };
  const body = req.validated?.body as KbBody;
  return respond.created(res, await service.createKb(id, body));
});

export const simpanRme = asyncHandler(async (req, res) => {
  const body = req.validated?.body as RmeSimpanInput;
  return respond.created(res, await service.simpanRme(body, req.auth?.stafId ?? null));
});

export const listRme = asyncHandler(async (req, res) => {
  const body = req.validated?.body as RmeListInput;
  return respond.ok(res, await service.listRme(body));
});

export default {
  createKunjungan,
  createCatatan,
  listKehamilan,
  createKehamilan,
  listAnc,
  createAnc,
  createPersalinan,
  createBayi,
  listImunisasi,
  createImunisasi,
  listKb,
  createKb
};
