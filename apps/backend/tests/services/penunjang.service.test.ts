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

import { PenunjangService } from '../../src/services/penunjang.service';
import type PenunjangRepository from '../../src/repositories/penunjang.repository';
import { ambilError } from './helpers';

const buatRepo = () => ({
  createOrder: jest.fn(),
  createOrderDetail: jest.fn().mockResolvedValue(undefined),
  listOrder: jest.fn().mockResolvedValue([]),
  createHasilLab: jest.fn(),
  createHasilRadiologi: jest.fn(),
  markDetailSelesai: jest.fn().mockResolvedValue(undefined)
});

type RepoMock = ReturnType<typeof buatRepo>;

const buatService = (repo: RepoMock) =>
  new PenunjangService(repo as unknown as PenunjangRepository);

describe('PenunjangService', () => {
  let repo: RepoMock;
  let service: PenunjangService;

  beforeEach(() => {
    repo = buatRepo();
    service = buatService(repo);
  });

  test('createOrder gagal bila order tidak bisa dibuat', async () => {
    repo.createOrder.mockResolvedValue(null);

    const err = await ambilError(
      service.createOrder('kunjungan-1', { jenis: 'LAB', layanan_ids: ['layanan-1'] }, 'staf-1')
    );

    expect(err.statusCode).toBe(500);
  });

  test('createOrder membuat detail untuk setiap layanan', async () => {
    repo.createOrder.mockResolvedValue('order-1');

    const hasil = await service.createOrder(
      'kunjungan-1',
      { jenis: 'LAB', layanan_ids: ['layanan-1', 'layanan-2'] },
      'staf-1'
    );

    expect(repo.createOrder).toHaveBeenCalledWith('kunjungan-1', 'staf-1', 'LAB');
    expect(repo.createOrderDetail).toHaveBeenNthCalledWith(1, 'order-1', 'layanan-1');
    expect(repo.createOrderDetail).toHaveBeenNthCalledWith(2, 'order-1', 'layanan-2');
    expect(hasil).toEqual({ order_id: 'order-1' });
  });

  test('createHasilLab gagal bila hasil tidak tersimpan', async () => {
    repo.createHasilLab.mockResolvedValue(null);

    const err = await ambilError(
      service.createHasilLab(
        { order_detail_id: 'detail-1', parameter_id: 'parameter-1', nilai: '12' },
        'staf-1'
      )
    );

    expect(err.statusCode).toBe(500);
    expect(repo.markDetailSelesai).not.toHaveBeenCalled();
  });

  test('createHasilLab sukses menandai detail selesai', async () => {
    repo.createHasilLab.mockResolvedValue({ hasil_id: 'hasil-1' });

    await service.createHasilLab(
      { order_detail_id: 'detail-1', parameter_id: 'parameter-1', nilai: '12', flag: 'N' },
      'staf-1'
    );

    expect(repo.markDetailSelesai).toHaveBeenCalledWith('detail-1');
  });

  test('createHasilRadiologi gagal bila hasil tidak tersimpan', async () => {
    repo.createHasilRadiologi.mockResolvedValue(null);

    const err = await ambilError(
      service.createHasilRadiologi(
        { order_detail_id: 'detail-1', temuan: 'normal', kesan: 'tidak ada kelainan' },
        'staf-1'
      )
    );

    expect(err.statusCode).toBe(500);
  });

  test('createHasilRadiologi sukses menandai detail selesai', async () => {
    repo.createHasilRadiologi.mockResolvedValue({ hasil_id: 'rad-1' });

    await service.createHasilRadiologi(
      { order_detail_id: 'detail-1', temuan: 'normal', kesan: 'tidak ada kelainan' },
      'staf-1'
    );

    expect(repo.markDetailSelesai).toHaveBeenCalledWith('detail-1');
  });
});
