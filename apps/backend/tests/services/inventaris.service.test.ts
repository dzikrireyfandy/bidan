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

import { InventarisService } from '../../src/services/inventaris.service';
import type InventarisRepository from '../../src/repositories/inventaris.repository';
import { ambilError } from './helpers';

const buatRepo = () => ({
  listObat: jest.fn().mockResolvedValue([]),
  countDuplikat: jest.fn().mockResolvedValue(0),
  createObat: jest.fn(),
  updateObat: jest.fn(),
  findObat: jest.fn(),
  createBatch: jest.fn(),
  addStok: jest.fn().mockResolvedValue(undefined),
  addMutasi: jest.fn().mockResolvedValue(undefined),
  insertStok: jest.fn().mockResolvedValue(undefined),
  listRiwayat: jest.fn().mockResolvedValue([]),
  listBatch: jest.fn().mockResolvedValue([]),
  listGudang: jest.fn().mockResolvedValue([]),
  listStokGudang: jest.fn().mockResolvedValue([]),
  pengeluaranResep: jest.fn(),
  markResepDiserahkan: jest.fn().mockResolvedValue(undefined)
});

type RepoMock = ReturnType<typeof buatRepo>;

const buatService = (repo: RepoMock) =>
  new InventarisService(repo as unknown as InventarisRepository);

const obatBody = {
  kode: 'OBT-1',
  nama_generik: 'Paracetamol',
  kategori: 'ANALGESIK',
  bentuk: 'TABLET',
  satuan: 'STRIP',
  stok_minimum: 10
};

describe('InventarisService', () => {
  let repo: RepoMock;
  let service: InventarisService;

  beforeEach(() => {
    repo = buatRepo();
    service = buatService(repo);
  });

  test('list membungkus kata kunci dan membatasi limit 500', () => {
    service.list({ q: 'paracetamol', limit: 9999 });

    expect(repo.listObat).toHaveBeenCalledWith(500, '%paracetamol%');
  });

  test('createObat menolak duplikat dengan ERR-INV-03', async () => {
    repo.countDuplikat.mockResolvedValue(1);

    const err = await ambilError(service.createObat(obatBody));

    expect(err).toMatchObject({ statusCode: 409, errorId: 'ERR-INV-03' });
    expect(repo.createObat).not.toHaveBeenCalled();
  });

  test('createObat menyimpan obat baru', async () => {
    repo.createObat.mockResolvedValue({ obat_id: 'obat-1' });

    const hasil = await service.createObat(obatBody);

    expect(repo.createObat).toHaveBeenCalledWith({
      kode: 'OBT-1',
      namaGenerik: 'Paracetamol',
      namaDagang: undefined,
      kategori: 'ANALGESIK',
      bentuk: 'TABLET',
      satuan: 'STRIP',
      kekuatan: undefined,
      golongan: undefined,
      stokMinimum: 10
    });
    expect(hasil).toEqual({ obat_id: 'obat-1' });
  });

  test('updateObat menolak body kosong dengan ERR-VAL-01', async () => {
    const err = await ambilError(service.updateObat('obat-1', {}));

    expect(err).toMatchObject({ statusCode: 422, errorId: 'ERR-VAL-01' });
  });

  test('updateObat mengembalikan ERR-INV-02 bila obat tidak ada', async () => {
    repo.updateObat.mockResolvedValue(null);

    const err = await ambilError(service.updateObat('obat-1', { stok_minimum: 5 }));

    expect(err).toMatchObject({ statusCode: 404, errorId: 'ERR-INV-02' });
  });

  test('restock menolak obat yang tidak ditemukan', async () => {
    repo.findObat.mockResolvedValue(null);

    const err = await ambilError(
      service.restock(
        'obat-1',
        {
          gudang_id: 'gudang-1',
          no_batch: 'B-1',
          tgl_kedaluwarsa: '2027-01-01',
          harga_beli: 1000,
          jumlah: 5
        },
        'staf-1'
      )
    );

    expect(err).toMatchObject({ statusCode: 404, errorId: 'ERR-INV-02' });
  });

  test('restock membuat batch, menambah stok, dan mencatat mutasi', async () => {
    repo.findObat.mockResolvedValue({ obat_id: 'obat-1' });
    repo.createBatch.mockResolvedValue('batch-1');

    const hasil = await service.restock(
      'obat-1',
      {
        gudang_id: 'gudang-1',
        no_batch: 'B-1',
        tgl_kedaluwarsa: '2027-01-01',
        harga_beli: 1000,
        jumlah: 5
      },
      'staf-1'
    );

    expect(repo.addStok).toHaveBeenCalledWith('batch-1', 'gudang-1', 5);
    expect(repo.addMutasi).toHaveBeenCalledWith({
      batchId: 'batch-1',
      gudangId: 'gudang-1',
      stafId: 'staf-1',
      jumlah: 5,
      keterangan: 'Restock'
    });
    expect(hasil).toEqual({ batch_id: 'batch-1', jumlah: 5 });
  });

  test('createBatch menolak obat yang tidak ditemukan', async () => {
    repo.findObat.mockResolvedValue(null);

    const err = await ambilError(
      service.createBatch('obat-1', {
        no_batch: 'B-2',
        tgl_kedaluwarsa: '2027-02-01',
        harga_beli: 2000,
        gudang_id: 'gudang-1',
        jumlah: 3
      })
    );

    expect(err).toMatchObject({ statusCode: 404, errorId: 'ERR-INV-02' });
  });

  test('pengeluaranResep menolak akun tanpa staf dengan 403', async () => {
    const err = await ambilError(
      service.pengeluaranResep('resep-1', { gudang_id: 'gudang-1' }, null)
    );

    expect(err).toMatchObject({ statusCode: 403, errorId: 'ERR-AUTH-03' });
  });

  test('pengeluaranResep menolak kode hasil bukan nol', async () => {
    repo.pengeluaranResep.mockResolvedValue(2);

    const err = await ambilError(
      service.pengeluaranResep('resep-1', { gudang_id: 'gudang-1' }, 'staf-1')
    );

    expect(err.statusCode).toBe(409);
    expect(repo.markResepDiserahkan).not.toHaveBeenCalled();
  });

  test('pengeluaranResep sukses menandai resep diserahkan', async () => {
    repo.pengeluaranResep.mockResolvedValue(0);

    const hasil = await service.pengeluaranResep('resep-1', { gudang_id: 'gudang-1' }, 'staf-1');

    expect(repo.markResepDiserahkan).toHaveBeenCalledWith('resep-1');
    expect(hasil).toEqual({ resep_id: 'resep-1', kode_hasil: 0 });
  });
});
