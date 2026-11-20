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

import { BayiService } from '../../src/services/bayi.service';
import type BayiRepository from '../../src/repositories/bayi.repository';
import { ambilError } from './helpers';

const buatRepo = () => ({
  findBayi: jest.fn(),
  findAsuhan: jest.fn(),
  createAsuhan: jest.fn(),
  listAsuhan: jest.fn().mockResolvedValue([]),
  createPemeriksaan: jest.fn(),
  enqueueKontrol: jest.fn().mockResolvedValue(undefined),
  listPemeriksaan: jest.fn().mockResolvedValue([]),
  grafikTumbuhKembang: jest.fn().mockResolvedValue([])
});

type RepoMock = ReturnType<typeof buatRepo>;

const buatService = (repo: RepoMock) => new BayiService(repo as unknown as BayiRepository);

const asuhanBody = {
  imd: true,
  vit_k1: true,
  salep_mata: false,
  hb0: true,
  keadaan_umum: 'BAIK'
};

describe('BayiService', () => {
  let repo: RepoMock;
  let service: BayiService;

  beforeEach(() => {
    repo = buatRepo();
    service = buatService(repo);
  });

  test('createAsuhan menolak bayi yang tidak ditemukan', async () => {
    repo.findBayi.mockResolvedValue(null);

    const err = await ambilError(service.createAsuhan('bayi-1', asuhanBody, 'staf-1'));

    expect(err.statusCode).toBe(404);
  });

  test('createAsuhan menolak asuhan ganda', async () => {
    repo.findBayi.mockResolvedValue({ bayi_id: 'bayi-1' });
    repo.findAsuhan.mockResolvedValue({ asuhan_id: 'asuhan-1' });

    const err = await ambilError(service.createAsuhan('bayi-1', asuhanBody, 'staf-1'));

    expect(err.statusCode).toBe(409);
    expect(repo.createAsuhan).not.toHaveBeenCalled();
  });

  test('createAsuhan sukses menyimpan data', async () => {
    repo.findBayi.mockResolvedValue({ bayi_id: 'bayi-1' });
    repo.findAsuhan.mockResolvedValue(null);
    repo.createAsuhan.mockResolvedValue({ asuhan_id: 'asuhan-1' });

    const hasil = await service.createAsuhan('bayi-1', asuhanBody, 'staf-1');

    expect(repo.createAsuhan).toHaveBeenCalledWith({
      bayiId: 'bayi-1',
      stafId: 'staf-1',
      imd: true,
      vitK1: true,
      salepMata: false,
      hb0: true,
      keadaanUmum: 'BAIK',
      catatan: undefined
    });
    expect(hasil).toEqual({ asuhan_id: 'asuhan-1' });
  });

  test('createPemeriksaan menjadwalkan kontrol bila tanggal diisi', async () => {
    repo.createPemeriksaan.mockResolvedValue({ pemeriksaan_id: 'periksa-1' });

    await service.createPemeriksaan(
      'bayi-1',
      {
        jenis: 'KN1',
        tgl_pemeriksaan: '2026-11-20',
        ikterus: false,
        tanda_bahaya: false,
        tgl_kontrol_berikutnya: '2026-11-27'
      },
      'staf-1'
    );

    expect(repo.enqueueKontrol).toHaveBeenCalledWith('bayi-1', '2026-11-27');
  });

  test('createPemeriksaan tidak menjadwalkan kontrol bila kosong', async () => {
    repo.createPemeriksaan.mockResolvedValue({ pemeriksaan_id: 'periksa-1' });

    await service.createPemeriksaan(
      'bayi-1',
      { jenis: 'KN2', tgl_pemeriksaan: '2026-11-20', ikterus: false, tanda_bahaya: false },
      null
    );

    expect(repo.enqueueKontrol).not.toHaveBeenCalled();
  });

  test('createPemeriksaan mengembalikan 500 bila gagal simpan', async () => {
    repo.createPemeriksaan.mockResolvedValue(null);

    const err = await ambilError(
      service.createPemeriksaan(
        'bayi-1',
        { jenis: 'KN1', tgl_pemeriksaan: '2026-11-20', ikterus: false, tanda_bahaya: false },
        null
      )
    );

    expect(err.statusCode).toBe(500);
  });

  test('grafik meneruskan ke repository', async () => {
    await service.grafik('bayi-1');

    expect(repo.grafikTumbuhKembang).toHaveBeenCalledWith('bayi-1');
  });
});
