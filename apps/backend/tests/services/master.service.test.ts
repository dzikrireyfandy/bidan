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

import { MasterService } from '../../src/services/master.service';
import MasterRepository from '../../src/repositories/master.repository';
import { MASTER_DEFINITIONS } from '../../src/validation/master';
import { ambilError, ambilErrorSync } from './helpers';

const definisi = MASTER_DEFINITIONS[0]!;

describe('MasterService', () => {
  let repoCreate: jest.SpyInstance;
  let repoUpdate: jest.SpyInstance;
  let repoList: jest.SpyInstance;
  let service: MasterService;

  beforeEach(() => {
    jest.restoreAllMocks();
    repoCreate = jest.spyOn(MasterRepository.prototype, 'create').mockResolvedValue(undefined);
    repoUpdate = jest.spyOn(MasterRepository.prototype, 'update').mockResolvedValue(undefined);
    repoList = jest.spyOn(MasterRepository.prototype, 'list').mockResolvedValue([]);
    service = new MasterService(definisi);
  });

  test('create hanya meneruskan kolom yang didefinisikan', async () => {
    repoCreate.mockResolvedValue({ kode: 'U1', nama: 'Unit Uji' });

    await service.create({ kode: 'U1', nama: 'Unit Uji', kolom_liar: 'dibuang' });

    expect(repoCreate).toHaveBeenCalledWith({ kode: 'U1', nama: 'Unit Uji' });
  });

  test('create menolak body tanpa kolom valid', () => {
    const err = ambilErrorSync(() => service.create({ kolom_liar: 'x' }));

    expect(err).toMatchObject({ statusCode: 422, errorId: 'ERR-VAL-01' });
    expect(repoCreate).not.toHaveBeenCalled();
  });

  test('update menolak body tanpa kolom valid', async () => {
    const err = await ambilError(service.update('id-1', { kolom_liar: 'x' }));

    expect(err).toMatchObject({ statusCode: 422, errorId: 'ERR-VAL-01' });
  });

  test('update mengembalikan 404 bila data tidak ada', async () => {
    repoUpdate.mockResolvedValue(undefined);

    const err = await ambilError(service.update('id-1', { nama: 'Baru' }));

    expect(err.statusCode).toBe(404);
  });

  test('update sukses mengembalikan baris terbaru', async () => {
    repoUpdate.mockResolvedValue({ kode: 'U1', nama: 'Baru' });

    const hasil = await service.update('id-1', { nama: 'Baru' });

    expect(repoUpdate).toHaveBeenCalledWith('id-1', { nama: 'Baru' });
    expect(hasil).toEqual({ kode: 'U1', nama: 'Baru' });
  });

  test('list membatasi limit maksimal 500 dan meneruskan offset', () => {
    service.list(9999, 25);

    expect(repoList).toHaveBeenCalledWith(500, 25);
  });
});
