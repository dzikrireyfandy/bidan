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

import { ReservasiService } from '../../src/services/reservasi.service';
import type ReservasiRepository from '../../src/repositories/reservasi.repository';
import { ambilError } from './helpers';

const buatRepo = () => ({
  list: jest.fn().mockResolvedValue([]),
  findJadwal: jest.fn(),
  reschedule: jest.fn(),
  cancel: jest.fn(),
  updateStatus: jest.fn(),
  listJadwal: jest.fn().mockResolvedValue([]),
  createJadwal: jest.fn(),
  updateJadwal: jest.fn()
});

type RepoMock = ReturnType<typeof buatRepo>;

const buatService = (repo: RepoMock) =>
  new ReservasiService(repo as unknown as ReservasiRepository);

describe('ReservasiService', () => {
  let repo: RepoMock;
  let service: ReservasiService;

  beforeEach(() => {
    repo = buatRepo();
    service = buatService(repo);
  });

  test('list membatasi limit maksimal 200', () => {
    service.list({ limit: 9999, tanggal: '2026-11-20' });

    expect(repo.list).toHaveBeenCalledWith(200, '2026-11-20');
  });

  test('reschedule menolak jadwal yang tidak ada', async () => {
    repo.findJadwal.mockResolvedValue(null);

    const err = await ambilError(
      service.reschedule('reservasi-1', { jadwal_id: 'jadwal-1' })
    );

    expect(err.statusCode).toBe(404);
  });

  test('reschedule menolak reservasi yang tidak ditemukan', async () => {
    repo.findJadwal.mockResolvedValue({ jadwal_id: 'jadwal-1' });
    repo.reschedule.mockResolvedValue(null);

    const err = await ambilError(
      service.reschedule('reservasi-1', { jadwal_id: 'jadwal-1' })
    );

    expect(err.statusCode).toBe(404);
  });

  test('reschedule sukses meneruskan nomor dan estimasi jam', async () => {
    repo.findJadwal.mockResolvedValue({ jadwal_id: 'jadwal-1' });
    repo.reschedule.mockResolvedValue({ reservasi_id: 'reservasi-1' });

    const hasil = await service.reschedule('reservasi-1', {
      jadwal_id: 'jadwal-1',
      nomor_antrean: 4,
      estimasi_jam: '09:30'
    });

    expect(repo.reschedule).toHaveBeenCalledWith('reservasi-1', {
      jadwalId: 'jadwal-1',
      nomor: 4,
      jam: '09:30'
    });
    expect(hasil).toEqual({ reservasi_id: 'reservasi-1' });
  });

  test('cancel mengembalikan 404 bila reservasi tidak ada', async () => {
    repo.cancel.mockResolvedValue(null);

    const err = await ambilError(service.cancel('reservasi-1'));

    expect(err.statusCode).toBe(404);
  });

  test('updateStatus mengembalikan 404 bila reservasi tidak ada', async () => {
    repo.updateStatus.mockResolvedValue(null);

    const err = await ambilError(service.updateStatus('reservasi-1', { status: 'SELESAI' }));

    expect(err.statusCode).toBe(404);
  });

  test('createJadwal menolak unit atau ruangan kosong', async () => {
    const err = await ambilError(
      service.createJadwal(
        {
          tanggal: '2026-11-21',
          jam_mulai: '08:00',
          jam_selesai: '12:00',
          kuota_maks: 10,
          durasi_per_pasien: 30
        },
        'staf-1'
      )
    );

    expect(err).toMatchObject({ statusCode: 422, errorId: 'ERR-VAL-01' });
  });

  test('createJadwal memakai staf dari token bila body tidak mengisi', async () => {
    repo.createJadwal.mockResolvedValue({ jadwal_id: 'jadwal-1' });

    await service.createJadwal(
      {
        unit_id: 'unit-1',
        ruangan_id: 'ruangan-1',
        tanggal: '2026-11-21',
        jam_mulai: '08:00',
        jam_selesai: '12:00',
        kuota_maks: 10,
        durasi_per_pasien: 30
      },
      'staf-dari-token'
    );

    expect(repo.createJadwal).toHaveBeenCalledWith(
      expect.objectContaining({ stafId: 'staf-dari-token', unitId: 'unit-1', ruanganId: 'ruangan-1' })
    );
  });

  test('updateJadwal menolak body kosong', async () => {
    const err = await ambilError(service.updateJadwal('jadwal-1', {}));

    expect(err).toMatchObject({ statusCode: 422, errorId: 'ERR-VAL-01' });
  });

  test('updateJadwal mengembalikan 404 bila jadwal tidak ada', async () => {
    repo.updateJadwal.mockResolvedValue(null);

    const err = await ambilError(service.updateJadwal('jadwal-1', { kuota_maks: 20 }));

    expect(err.statusCode).toBe(404);
  });
});
