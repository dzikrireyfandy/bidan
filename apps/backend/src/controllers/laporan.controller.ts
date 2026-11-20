import { asyncHandler } from '../middleware/asyncHandler';
import respond from '../http/respond';
import { LaporanService } from '../services/laporan.service';
import type { KontenBody, KontenUpdateBody, PeriodeInput } from '../validation/laporan';

const service = new LaporanService();

export const ringkasan = asyncHandler(async (req, res) => {
  const body = req.validated?.body as PeriodeInput;
  return respond.ok(res, await service.ringkasan(body));
});

export const trenLayanan = asyncHandler(async (req, res) => {
  const body = req.validated?.body as PeriodeInput;
  return respond.ok(res, await service.trenLayanan(body));
});

export const jamTersibuk = asyncHandler(async (_req, res) => {
  return respond.ok(res, await service.jamTersibuk());
});

export const perbandingan = asyncHandler(async (req, res) => {
  const body = req.validated?.body as PeriodeInput;
  return respond.ok(res, await service.perbandingan(body));
});

export const exportLaporan = asyncHandler(async (req, res) => {
  const body = req.validated?.body as PeriodeInput;
  return respond.ok(res, await service.export(body));
});

export const listKonten = asyncHandler(async (req, res) => {
  const body = req.validated?.body as PeriodeInput;
  return respond.ok(res, await service.listKonten(body));
});

export const createKonten = asyncHandler(async (req, res) => {
  const body = req.validated?.body as KontenBody;
  return respond.created(res, await service.createKonten(body));
});

export const updateKonten = asyncHandler(async (req, res) => {
  const { id } = req.validated?.params as { id: string };
  const body = req.validated?.body as KontenUpdateBody;
  return respond.ok(res, await service.updateKonten(id, body));
});

export const deleteKonten = asyncHandler(async (req, res) => {
  const { id } = req.validated?.params as { id: string };
  return respond.ok(res, await service.deleteKonten(id));
});

export const listNotifikasi = asyncHandler(async (req, res) => {
  const body = req.validated?.body as PeriodeInput;
  return respond.ok(res, await service.listNotifikasi(body));
});

export const kirimUlangNotifikasi = asyncHandler(async (req, res) => {
  const { id } = req.validated?.params as { id: string };
  return respond.ok(res, await service.kirimUlangNotifikasi(id));
});

export const listAudit = asyncHandler(async (req, res) => {
  const body = req.validated?.body as PeriodeInput;
  return respond.ok(res, await service.listAudit(body));
});

export default {
  ringkasan,
  trenLayanan,
  jamTersibuk,
  perbandingan,
  exportLaporan,
  listKonten,
  createKonten,
  updateKonten,
  deleteKonten,
  listNotifikasi,
  kirimUlangNotifikasi,
  listAudit
};
