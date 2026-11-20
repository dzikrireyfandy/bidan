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

import { PublicService } from '../../src/services/public.service';
import type PublicRepository from '../../src/repositories/public.repository';
import { ambilError } from './helpers';

const buatRepo = () => ({
  listKonten: jest.fn().mockResolvedValue([]),
  listLayanan: jest.fn().mockResolvedValue([]),
  listJadwal: jest.fn().mockResolvedValue([]),
  findPasien: jest.fn(),
  findJadwalSlot: jest.fn(),
  countReservasi: jest.fn(),
  createReservasi: jest.fn()
});

type RepoMock = ReturnType<typeof buatRepo>;

const buatService = (repo: RepoMock) => new PublicService(repo as unknown as PublicRepository);

describe('PublicService', () => {
  let repo: RepoMock;
  let service: PublicService;

  beforeEach(() => {
    repo = buatRepo();
    service = buatService(repo);
  });

  test('cekPasien mengembalikan terdaftar true bila ditemukan', async () => {
    repo.findPasien.mockResolvedValue({ pasien_id: 'pasien-1', nama: 'Ani' });

    const hasil = await service.cekPasien('3201010101010001');

    expect(repo.findPasien).toHaveBeenCalledWith('3201010101010001', null);
    expect(hasil).toEqual({ terdaftar: true, pasien_id: 'pasien-1', nama: 'Ani' });
  });

  test('cekPasien mengembalikan terdaftar false bila tidak ditemukan', async () => {
    repo.findPasien.mockResolvedValue(null);

    await expect(service.cekPasien(undefined, 'RM-1')).resolves.toEqual({ terdaftar: false });
  });

  test('createReservasi menolak jadwal yang tidak tersedia', async () => {
    repo.findJadwalSlot.mockResolvedValue(null);

    const err = await ambilError(
      service.createReservasi({
        pasien_id: 'pasien-1',
        jadwal_id: 'jadwal-1',
        layanan_id: 'layanan-1',
        metode_daftar: 'ONLINE'
      })
    );

    expect(err.statusCode).toBe(404);
  });

  test('createReservasi menolak kuota penuh dengan ERR-RSV-01', async () => {
    repo.findJadwalSlot.mockResolvedValue({ kuota_maks: 2, durasi_per_pasien: 30, jam_mulai: '08:00' });
    repo.countReservasi.mockResolvedValue(2);

    const err = await ambilError(
      service.createReservasi({
        pasien_id: 'pasien-1',
        jadwal_id: 'jadwal-1',
        layanan_id: 'layanan-1',
        metode_daftar: 'ONLINE'
      })
    );

    expect(err).toMatchObject({ statusCode: 409, errorId: 'ERR-RSV-01' });
    expect(repo.createReservasi).not.toHaveBeenCalled();
  });

  test('createReservasi menghitung nomor antrean dan offset jam', async () => {
    repo.findJadwalSlot.mockResolvedValue({ kuota_maks: 5, durasi_per_pasien: 30, jam_mulai: '08:00' });
    repo.countReservasi.mockResolvedValue(2);
    repo.createReservasi.mockResolvedValue({ reservasi_id: 'reservasi-1' });

    const hasil = await service.createReservasi({
      pasien_id: 'pasien-1',
      jadwal_id: 'jadwal-1',
      layanan_id: 'layanan-1',
      metode_daftar: 'ONLINE'
    });

    expect(repo.createReservasi).toHaveBeenCalledWith({
      pasienId: 'pasien-1',
      jadwalId: 'jadwal-1',
      layananId: 'layanan-1',
      nomor: 3,
      offset: 60,
      jam: '08:00',
      metode: 'ONLINE'
    });
    expect(hasil).toEqual({ reservasi_id: 'reservasi-1' });
  });

  test('createReservasi mengembalikan 500 bila insert gagal', async () => {
    repo.findJadwalSlot.mockResolvedValue({ kuota_maks: 5, durasi_per_pasien: 30, jam_mulai: '08:00' });
    repo.countReservasi.mockResolvedValue(0);
    repo.createReservasi.mockResolvedValue(null);

    const err = await ambilError(
      service.createReservasi({
        pasien_id: 'pasien-1',
        jadwal_id: 'jadwal-1',
        layanan_id: 'layanan-1',
        metode_daftar: 'WALK_IN'
      })
    );

    expect(err.statusCode).toBe(500);
  });

  test('listKonten membatasi limit maksimal 200', () => {
    service.listKonten(9999, 'BERITA');

    expect(repo.listKonten).toHaveBeenCalledWith(200, 'BERITA');
  });
});
