jest.mock('../../src/db/pool', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
    execute: jest.fn(),
    transaction: jest.fn(),
    close: jest.fn(),
    connect: jest.fn()
  },
  SqlConnection: class SqlConnectionStub {}
}));

import { LaporanService } from '../../src/services/laporan.service';
import type LaporanRepository from '../../src/repositories/laporan.repository';
import { ambilError, ambilErrorSync } from './helpers';

const buatRepo = () => ({
  ringkasanKunjungan: jest.fn().mockResolvedValue({ total_kunjungan: 0 }),
  ringkasanPendapatan: jest.fn().mockResolvedValue({ total_pendapatan: 0 }),
  ringkasanRawatInap: jest.fn().mockResolvedValue({ episode_rawat_inap: 0 }),
  trenLayanan: jest.fn().mockResolvedValue([]),
  jamTersibuk: jest.fn().mockResolvedValue([]),
  perbandingan: jest.fn().mockResolvedValue([]),
  export: jest.fn().mockResolvedValue([]),
  listKonten: jest.fn().mockResolvedValue([]),
  createKonten: jest.fn(),
  updateKonten: jest.fn(),
  softDeleteKonten: jest.fn(),
  listNotifikasi: jest.fn().mockResolvedValue([]),
  kirimUlangNotifikasi: jest.fn(),
  listAudit: jest.fn().mockResolvedValue([])
});

type RepoMock = ReturnType<typeof buatRepo>;

const buatService = (repo: RepoMock) => new LaporanService(repo as unknown as LaporanRepository);

describe('LaporanService', () => {
  let repo: RepoMock;
  let service: LaporanService;

  beforeEach(() => {
    repo = buatRepo();
    service = buatService(repo);
  });

  test('ringkasan menolak periode tanpa data dengan ERR-RPT-01', async () => {
    const err = await ambilError(service.ringkasan({}));

    expect(err).toMatchObject({ statusCode: 404, errorId: 'ERR-RPT-01' });
  });

  test('ringkasan mengembalikan agregat bila ada data', async () => {
    repo.ringkasanKunjungan.mockResolvedValue({ total_kunjungan: 5 });
    repo.ringkasanPendapatan.mockResolvedValue({ total_pendapatan: 1000 });
    repo.ringkasanRawatInap.mockResolvedValue({ episode_rawat_inap: 1 });

    const hasil = await service.ringkasan({ dari: '2026-01-01', sampai: '2026-01-31' });

    expect(hasil).toEqual({
      kunjungan: { total_kunjungan: 5 },
      pendapatan: { total_pendapatan: 1000 },
      rawat_inap: { episode_rawat_inap: 1 }
    });
  });

  test('ringkasan menolak periode terbalik', async () => {
    const err = await ambilError(
      service.ringkasan({ dari: '2026-02-01', sampai: '2026-01-01' })
    );

    expect(err).toMatchObject({ statusCode: 422, errorId: 'ERR-VAL-01' });
  });

  test('trenLayanan membatasi limit maksimal 200', () => {
    service.trenLayanan({ limit: 9999 });

    expect(repo.trenLayanan).toHaveBeenCalledWith(200, { dari: null, sampai: null });
  });

  test('export mengembalikan format JSON', async () => {
    const hasil = await service.export({});

    expect(hasil).toEqual({ format: 'JSON', rows: [] });
  });

  test('updateKonten menolak body kosong', async () => {
    const err = await ambilError(service.updateKonten('konten-1', {}));

    expect(err).toMatchObject({ statusCode: 422, errorId: 'ERR-VAL-01' });
  });

  test('updateKonten mengembalikan ERR-CNT-01 bila tidak ada', async () => {
    repo.updateKonten.mockResolvedValue(null);

    const err = await ambilError(service.updateKonten('konten-1', { judul: 'Baru' }));

    expect(err).toMatchObject({ statusCode: 404, errorId: 'ERR-CNT-01' });
  });

  test('deleteKonten mengembalikan ERR-CNT-01 bila tidak ada', async () => {
    repo.softDeleteKonten.mockResolvedValue(null);

    const err = await ambilError(service.deleteKonten('konten-1'));

    expect(err).toMatchObject({ statusCode: 404, errorId: 'ERR-CNT-01' });
  });

  test('kirimUlangNotifikasi mengembalikan 404 bila log tidak ada', async () => {
    repo.kirimUlangNotifikasi.mockResolvedValue(null);

    const err = await ambilError(service.kirimUlangNotifikasi('notif-1'));

    expect(err.statusCode).toBe(404);
  });

  test('createKonten mengembalikan 500 bila gagal simpan', async () => {
    repo.createKonten.mockResolvedValue(null);

    const err = await ambilError(
      service.createKonten({ tipe: 'BERITA', judul: 'Judul', isi: 'Isi', media_url: '', urutan: 0, terbit: true })
    );

    expect(err.statusCode).toBe(500);
  });

  test('listAudit menolak periode lebih dari 366 hari', () => {
    const err = ambilErrorSync(() =>
      service.listAudit({ dari: '2025-01-01', sampai: '2026-06-01' })
    );

    expect(err.errorId).toBe('ERR-VAL-01');
  });
});
