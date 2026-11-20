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

import { PasienService } from '../../src/services/pasien.service';
import type PasienRepository from '../../src/repositories/pasien.repository';
import { ambilError } from './helpers';

const buatRepo = () => ({
  searchIdentitas: jest.fn().mockResolvedValue([]),
  findByNik: jest.fn(),
  createPasien: jest.fn(),
  findDokterAktif: jest.fn(),
  findPenjaminPertama: jest.fn(),
  createKunjungan: jest.fn(),
  listPasien: jest.fn().mockResolvedValue([]),
  findById: jest.fn(),
  listAlergi: jest.fn().mockResolvedValue([]),
  listKunjungan: jest.fn().mockResolvedValue([]),
  listKehamilan: jest.fn().mockResolvedValue([]),
  createAlergi: jest.fn(),
  updateAlergi: jest.fn(),
  createCatatanKeperawatan: jest.fn().mockResolvedValue(undefined),
  listKunjunganExport: jest.fn().mockResolvedValue([])
});

type RepoMock = ReturnType<typeof buatRepo>;

const buatService = (repo: RepoMock) => new PasienService(repo as unknown as PasienRepository);

const walkInBody = {
  nik: '3201010101010001',
  nama: 'Pasien Uji',
  jenis_kelamin: 'PEREMPUAN',
  tgl_lahir: '1990-01-01',
  tempat_lahir: 'Bandung',
  alamat: 'Jl. Uji',
  no_telepon: '081234567890',
  gol_darah: 'O',
  status_pernikahan: 'KAWIN',
  pekerjaan: 'IRT',
  unit_id: 'unit-1',
  jenis_kunjungan: 'RAWAT_JALAN'
};

describe('PasienService', () => {
  let repo: RepoMock;
  let service: PasienService;

  beforeEach(() => {
    repo = buatRepo();
    service = buatService(repo);
  });

  test('walkIn memakai pasien lama berdasarkan NIK', async () => {
    repo.findByNik.mockResolvedValue('pasien-1');
    repo.findDokterAktif.mockResolvedValue('dokter-1');
    repo.findPenjaminPertama.mockResolvedValue('penjamin-1');
    repo.createKunjungan.mockResolvedValue('kunjungan-1');

    const hasil = await service.walkIn(walkInBody);

    expect(repo.createPasien).not.toHaveBeenCalled();
    expect(hasil).toEqual({ pasien_id: 'pasien-1', kunjungan_id: 'kunjungan-1' });
  });

  test('walkIn membuat pasien baru bila NIK belum terdaftar', async () => {
    repo.findByNik.mockResolvedValue(null);
    repo.createPasien.mockResolvedValue('pasien-baru');
    repo.findDokterAktif.mockResolvedValue('dokter-1');
    repo.findPenjaminPertama.mockResolvedValue('penjamin-1');
    repo.createKunjungan.mockResolvedValue('kunjungan-1');

    const hasil = await service.walkIn(walkInBody);

    expect(repo.createPasien).toHaveBeenCalledWith(walkInBody);
    expect(hasil.pasien_id).toBe('pasien-baru');
  });

  test('walkIn gagal bila pasien baru tidak bisa dibuat', async () => {
    repo.findByNik.mockResolvedValue(null);
    repo.createPasien.mockResolvedValue(null);

    const err = await ambilError(service.walkIn(walkInBody));

    expect(err.statusCode).toBe(500);
  });

  test('walkIn gagal bila tidak ada dokter aktif', async () => {
    repo.findByNik.mockResolvedValue('pasien-1');
    repo.findDokterAktif.mockResolvedValue(null);

    const err = await ambilError(service.walkIn(walkInBody));

    expect(err.statusCode).toBe(400);
  });

  test('walkIn gagal bila tidak ada penjamin', async () => {
    repo.findByNik.mockResolvedValue('pasien-1');
    repo.findDokterAktif.mockResolvedValue('dokter-1');
    repo.findPenjaminPertama.mockResolvedValue(null);

    const err = await ambilError(service.walkIn(walkInBody));

    expect(err.statusCode).toBe(400);
  });

  test('rmeDetail mengembalikan ERR-RME-04 bila pasien tidak ada', async () => {
    repo.findById.mockResolvedValue(null);

    const err = await ambilError(service.rmeDetail('pasien-1'));

    expect(err).toMatchObject({ statusCode: 404, errorId: 'ERR-RME-04' });
  });

  test('rmeDetail menggabungkan data pasien, alergi, kunjungan, dan kehamilan', async () => {
    repo.findById.mockResolvedValue({ pasien_id: 'pasien-1' });

    const hasil = await service.rmeDetail('pasien-1');

    expect(hasil).toEqual({
      pasien: { pasien_id: 'pasien-1' },
      alergi: [],
      kunjungan: [],
      kehamilan: []
    });
  });

  test('addAlergi mengembalikan 500 bila gagal simpan', async () => {
    repo.createAlergi.mockResolvedValue(null);

    const err = await ambilError(
      service.addAlergi('pasien-1', { kategori: 'OBAT', nama: 'Amoksisilin' }, 'staf-1')
    );

    expect(err.statusCode).toBe(500);
  });

  test('updateAlergi menolak body kosong', async () => {
    const err = await ambilError(service.updateAlergi('alergi-1', {}));

    expect(err).toMatchObject({ statusCode: 422, errorId: 'ERR-VAL-01' });
  });

  test('exportRme mengembalikan ERR-RME-04 bila pasien tidak ada', async () => {
    repo.findById.mockResolvedValue(null);

    const err = await ambilError(service.exportRme('pasien-1'));

    expect(err).toMatchObject({ statusCode: 404, errorId: 'ERR-RME-04' });
  });

  test('konfirmasiRedFlag mencatat keperawatan bila kunjungan diisi', async () => {
    const hasil = await service.konfirmasiRedFlag(
      'pasien-1',
      { kunjungan_id: 'kunjungan-1' },
      { stafId: 'staf-1', akunId: 'akun-1' }
    );

    expect(repo.createCatatanKeperawatan).toHaveBeenCalledWith({
      kunjunganId: 'kunjungan-1',
      stafId: 'staf-1',
      isi: 'Tenaga klinis mengonfirmasi pembacaan red-flag pasien'
    });
    expect(hasil).toEqual({ pasien_id: 'pasien-1', dikonfirmasi: true, oleh: 'akun-1' });
  });

  test('list membatasi limit maksimal 200 dan membungkus kata kunci', () => {
    service.list(9999, 'ani');

    expect(repo.listPasien).toHaveBeenCalledWith(200, '%ani%');
  });
});
