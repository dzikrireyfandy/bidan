import { asyncHandler } from '../middleware/asyncHandler';
import respond from '../http/respond';
import { RanapService } from '../services/ranap.service';
import type {
  AdmisiBody,
  AmbulansBody,
  OperasiBody,
  OperasiUpdateBody,
  PerjalananBody,
  PindahBody,
  PulangBody,
  RanapListInput,
  TriaseBody,
  VisiteBody
} from '../validation/ranap';

const service = new RanapService();

export const listTempatTidur = asyncHandler(async (req, res) => {
  const body = req.validated?.body as RanapListInput;
  return respond.ok(res, await service.listTempatTidur(body));
});

export const admisi = asyncHandler(async (req, res) => {
  const { id } = req.validated?.params as { id: string };
  const body = req.validated?.body as AdmisiBody;
  return respond.created(res, await service.admisi(id, body));
});

export const pindah = asyncHandler(async (req, res) => {
  const { id } = req.validated?.params as { id: string };
  const body = req.validated?.body as PindahBody;
  return respond.ok(res, await service.pindah(id, body));
});

export const pulang = asyncHandler(async (req, res) => {
  const { id } = req.validated?.params as { id: string };
  const body = req.validated?.body as PulangBody;
  return respond.ok(res, await service.pulang(id, body));
});

export const visite = asyncHandler(async (req, res) => {
  const { id } = req.validated?.params as { id: string };
  const body = req.validated?.body as VisiteBody;
  return respond.created(res, await service.visite(id, body, req.auth?.stafId ?? null));
});

export const triase = asyncHandler(async (req, res) => {
  const { id } = req.validated?.params as { id: string };
  const body = req.validated?.body as TriaseBody;
  return respond.created(res, await service.triase(id, body, req.auth?.stafId ?? null));
});

export const listIgdAntrean = asyncHandler(async (_req, res) => {
  return respond.ok(res, await service.listIgdAntrean());
});

export const listOperasi = asyncHandler(async (req, res) => {
  const body = req.validated?.body as RanapListInput;
  return respond.ok(res, await service.listOperasi(body));
});

export const createOperasi = asyncHandler(async (req, res) => {
  const { id } = req.validated?.params as { id: string };
  const body = req.validated?.body as OperasiBody;
  return respond.created(res, await service.createOperasi(id, body));
});

export const updateOperasi = asyncHandler(async (req, res) => {
  const { id } = req.validated?.params as { id: string };
  const body = req.validated?.body as OperasiUpdateBody;
  return respond.ok(res, await service.updateOperasi(id, body));
});

export const listAmbulans = asyncHandler(async (_req, res) => {
  return respond.ok(res, await service.listAmbulans());
});

export const createAmbulans = asyncHandler(async (req, res) => {
  const body = req.validated?.body as AmbulansBody;
  return respond.created(res, await service.createAmbulans(body));
});

export const createPerjalanan = asyncHandler(async (req, res) => {
  const { id } = req.validated?.params as { id: string };
  const body = req.validated?.body as PerjalananBody;
  return respond.created(res, await service.createPerjalanan(id, body, req.auth?.stafId ?? null));
});

export const listPerjalanan = asyncHandler(async (req, res) => {
  const body = req.validated?.body as RanapListInput;
  return respond.ok(res, await service.listPerjalanan(body));
});

export default {
  listTempatTidur,
  admisi,
  pindah,
  pulang,
  visite,
  triase,
  listIgdAntrean,
  listOperasi,
  createOperasi,
  updateOperasi,
  listAmbulans,
  createAmbulans,
  createPerjalanan,
  listPerjalanan
};
