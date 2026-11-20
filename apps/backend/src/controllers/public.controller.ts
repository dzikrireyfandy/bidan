import { asyncHandler } from '../middleware/asyncHandler';
import respond from '../http/respond';
import { PublicService } from '../services/public.service';
import type {
  CekPasienInput,
  KontenListInput,
  LayananListInput,
  ReservasiInput
} from '../validation/public';

const service = new PublicService();

export const listKonten = asyncHandler(async (req, res) => {
  const body = req.validated?.body as KontenListInput;
  return respond.ok(res, await service.listKonten(body.limit, body.tipe));
});

export const listLayanan = asyncHandler(async (req, res) => {
  const body = req.validated?.body as LayananListInput;
  return respond.ok(res, await service.listLayanan(body.limit, body.unit_id));
});

export const listJadwal = asyncHandler(async (req, res) => {
  const body = req.validated?.body as LayananListInput;
  return respond.ok(res, await service.listJadwal(body.limit, body.unit_id));
});

export const cekPasien = asyncHandler(async (req, res) => {
  const body = req.validated?.body as CekPasienInput;
  return respond.ok(res, await service.cekPasien(body.nik, body.no_rm));
});

export const createReservasi = asyncHandler(async (req, res) => {
  const body = req.validated?.body as ReservasiInput;
  return respond.created(res, await service.createReservasi(body));
});

export default {
  listKonten,
  listLayanan,
  listJadwal,
  cekPasien,
  createReservasi
};
