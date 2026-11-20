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

import { RanapService } from '../../src/services/ranap.service';
import type RanapRepository from '../../src/repositories/ranap.repository';
import { ambilError } from './helpers';

const buatRepo = () => ({
  listTempatTidur: jest.fn().mockResolvedValue([]),
  findBedStatus: jest.fn(),
  createRawatInap: jest.fn(),
  setBedStatus: jest.fn().mockResolvedValue(undefined),
  findRawatInapBed: jest.fn(),
  pindahBed: jest.fn(),
  pulangRawatInap: jest.fn(),
  createVisite: jest.fn(),
  createTriase: jest.fn(),
  listIgdAntrean: jest.fn().mockResolvedValue([]),
  listOperasi: jest.fn().mockResolvedValue([]),
  countOperasiBentrok: jest.fn().mockResolvedValue(0),
  createOperasi: jest.fn(),
  updateOperasi: jest.fn(),
  listAmbulans: jest.fn().mockResolvedValue([]),
  createAmbulans: jest.fn(),
  createPerjalanan: jest.fn(),
  listPerjalanan: jest.fn().mockResolvedValue([])
});

type RepoMock = ReturnType<typeof buatRepo>;

const buatService = (repo: RepoMock) => new RanapService(repo as unknown as RanapRepository);

describe('RanapService', () => {
  let repo: RepoMock;
  let service: RanapService;

  beforeEach(() => {
    repo = buatRepo();
    service = buatService(repo);
  });

  test('admisi menolak bed yang tidak ditemukan', async () => {
    repo.findBedStatus.mockResolvedValue(null);

    const err = await ambilError(service.admisi('kunjungan-1', { bed_id: 'bed-1' }));

    expect(err.statusCode).toBe(404);
  });

  test('admisi menolak bed yang sudah terisi', async () => {
    repo.findBedStatus.mockResolvedValue('TERISI');

    const err = await ambilError(service.admisi('kunjungan-1', { bed_id: 'bed-1' }));

    expect(err.statusCode).toBe(409);
    expect(repo.createRawatInap).not.toHaveBeenCalled();
  });

  test('admisi sukses membuat rawat inap dan menandai bed terisi', async () => {
    repo.findBedStatus.mockResolvedValue('KOSONG');
    repo.createRawatInap.mockResolvedValue({ rawat_inap_id: 'ranap-1' });

    const hasil = await service.admisi('kunjungan-1', { bed_id: 'bed-1' });

    expect(repo.createRawatInap).toHaveBeenCalledWith('kunjungan-1', 'bed-1');
    expect(repo.setBedStatus).toHaveBeenCalledWith('bed-1', 'TERISI');
    expect(hasil).toEqual({ rawat_inap_id: 'ranap-1' });
  });

  test('pindah ke bed yang sama tidak mengubah status bed', async () => {
    repo.findRawatInapBed.mockResolvedValue('bed-1');
    repo.pindahBed.mockResolvedValue({ rawat_inap_id: 'ranap-1' });

    await service.pindah('ranap-1', { bed_id: 'bed-1' });

    expect(repo.setBedStatus).not.toHaveBeenCalled();
  });

  test('pindah menolak bed tujuan yang terisi', async () => {
    repo.findRawatInapBed.mockResolvedValue('bed-1');
    repo.findBedStatus.mockResolvedValue('TERISI');

    const err = await ambilError(service.pindah('ranap-1', { bed_id: 'bed-2' }));

    expect(err.statusCode).toBe(409);
  });

  test('pindah sukses mengosongkan bed lama dan mengisi bed baru', async () => {
    repo.findRawatInapBed.mockResolvedValue('bed-1');
    repo.findBedStatus.mockResolvedValue('KOSONG');
    repo.pindahBed.mockResolvedValue({ rawat_inap_id: 'ranap-1' });

    await service.pindah('ranap-1', { bed_id: 'bed-2', alasan_pindah: 'observasi' });

    expect(repo.setBedStatus).toHaveBeenNthCalledWith(1, 'bed-1', 'KOSONG');
    expect(repo.setBedStatus).toHaveBeenNthCalledWith(2, 'bed-2', 'TERISI');
  });

  test('pulang menolak kode hasil bukan nol', async () => {
    repo.pulangRawatInap.mockResolvedValue(1);

    const err = await ambilError(service.pulang('ranap-1', { cara_keluar: 'SEMBUH' }));

    expect(err.statusCode).toBe(409);
  });

  test('pulang sukses meneruskan cara keluar dan catatan', async () => {
    repo.pulangRawatInap.mockResolvedValue(0);

    const hasil = await service.pulang('ranap-1', {
      cara_keluar: 'DIRUJUK',
      catatan_pulang: 'kontrol poli'
    });

    expect(repo.pulangRawatInap).toHaveBeenCalledWith('ranap-1', 'DIRUJUK', 'kontrol poli');
    expect(hasil).toEqual({ rawat_inap_id: 'ranap-1', kode_hasil: 0 });
  });

  test('createOperasi menolak jadwal bentrok', async () => {
    repo.countOperasiBentrok.mockResolvedValue(1);

    const err = await ambilError(
      service.createOperasi('kunjungan-1', {
        layanan_id: 'layanan-1',
        ruangan_id: 'ruangan-1',
        jenis_anestesi: 'UMUM',
        jadwal_mulai: '2026-11-20 08:00'
      })
    );

    expect(err.statusCode).toBe(409);
    expect(repo.createOperasi).not.toHaveBeenCalled();
  });

  test('createPerjalanan menolak akun tanpa staf', async () => {
    const err = await ambilError(
      service.createPerjalanan(
        'ambulans-1',
        {
          pasien_id: 'pasien-1',
          layanan_id: 'layanan-1',
          asal: 'RS',
          tujuan: 'Rumah'
        },
        null
      )
    );

    expect(err).toMatchObject({ statusCode: 403, errorId: 'ERR-AUTH-03' });
  });

  test('updateOperasi menolak body kosong dengan ERR-VAL-01', async () => {
    const err = await ambilError(service.updateOperasi('operasi-1', {}));

    expect(err).toMatchObject({ statusCode: 422, errorId: 'ERR-VAL-01' });
  });

  test('listTempatTidur membatasi limit maksimal 300', () => {
    service.listTempatTidur({ limit: 9999 });

    expect(repo.listTempatTidur).toHaveBeenCalledWith(300);
  });
});
