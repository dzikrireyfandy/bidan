import { asyncHandler } from '../middleware/asyncHandler';
import respond from '../http/respond';
import { ReservasiService } from '../services/reservasi.service';
import type {
  JadwalBody,
  JadwalUlangBody,
  JadwalUpdateBody,
  ReservasiListInput,
  StatusBody
} from '../validation/reservasi';

const service = new ReservasiService();

export const listReservasi = asyncHandler(async (req, res) => {
  const body = req.validated?.body as ReservasiListInput;
  return respond.ok(res, await service.list(body));
});

export const reschedule = asyncHandler(async (req, res) => {
  const { id } = req.validated?.params as { id: string };
  const body = req.validated?.body as JadwalUlangBody;
  return respond.ok(res, await service.reschedule(id, body));
});

export const cancelReservasi = asyncHandler(async (req, res) => {
  const { id } = req.validated?.params as { id: string };
  return respond.ok(res, await service.cancel(id));
});

export const updateStatus = asyncHandler(async (req, res) => {
  const { id } = req.validated?.params as { id: string };
  const body = req.validated?.body as StatusBody;
  return respond.ok(res, await service.updateStatus(id, body));
});

export const listJadwal = asyncHandler(async (req, res) => {
  const body = req.validated?.body as ReservasiListInput;
  return respond.ok(res, await service.listJadwal(body));
});

export const createJadwal = asyncHandler(async (req, res) => {
  const body = req.validated?.body as JadwalBody;
  return respond.created(res, await service.createJadwal(body, req.auth?.stafId ?? null));
});

export const updateJadwal = asyncHandler(async (req, res) => {
  const { id } = req.validated?.params as { id: string };
  const body = req.validated?.body as JadwalUpdateBody;
  return respond.ok(res, await service.updateJadwal(id, body));
});

export default {
  listReservasi,
  reschedule,
  cancelReservasi,
  updateStatus,
  listJadwal,
  createJadwal,
  updateJadwal
};
