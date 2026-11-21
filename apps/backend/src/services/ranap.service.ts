import ApiError from '../errors/ApiError';
import { paginate } from '../validation/common';
import RanapRepository from '../repositories/ranap.repository';
import type {
  AdmisiBody,
  AmbulansBody,
  OperasiBody,
  OperasiUpdateBody,
  PerjalananBody,
  PindahBody,
  PulangBody,
  RanapListInput,
  TriaseBody,
  VisiteBody
} from '../validation/ranap';

export class RanapService {
  constructor(private readonly repository: RanapRepository = new RanapRepository()) {}

  listTempatTidur(body: RanapListInput): Promise<Record<string, unknown>[]> {
    return this.repository.listTempatTidur(paginate(body.limit, 200, 300));
  }

  async admisi(kunjunganId: string, body: AdmisiBody): Promise<Record<string, unknown>> {
    const status = await this.repository.findBedStatus(body.bed_id);
    if (!status) {
      throw ApiError.notFound('Tempat tidur tidak ditemukan');
    }
    if (status !== 'KOSONG') {
      throw ApiError.conflict('Tempat tidur tidak tersedia');
    }

    const row = await this.repository.createRawatInap(kunjunganId, body.bed_id);
    if (!row) {
      throw ApiError.internal('Gagal membuat rawat inap');
    }
    await this.repository.setBedStatus(body.bed_id, 'TERISI');
    return row;
  }

  async pindah(id: string, body: PindahBody): Promise<Record<string, unknown>> {
    const bedLama = await this.repository.findRawatInapBed(id);
    if (!bedLama) {
      throw ApiError.notFound('Rawat inap tidak ditemukan');
    }

    if (bedLama !== body.bed_id) {
      const statusBaru = await this.repository.findBedStatus(body.bed_id);
      if (!statusBaru) {
        throw ApiError.notFound('Tempat tidur tujuan tidak ditemukan');
      }
      if (statusBaru !== 'KOSONG') {
        throw ApiError.conflict('Tempat tidur tujuan tidak tersedia');
      }
    }

    const row = await this.repository.pindahBed(id, body.bed_id, body.alasan_pindah);
    if (!row) {
      throw ApiError.notFound('Rawat inap tidak ditemukan');
    }

    if (bedLama !== body.bed_id) {
      await this.repository.setBedStatus(bedLama, 'KOSONG');
      await this.repository.setBedStatus(body.bed_id, 'TERISI');
    }
    return row;
  }

  async pulang(id: string, body: PulangBody): Promise<{ rawat_inap_id: string; kode_hasil: number }> {
    const kode = await this.repository.pulangRawatInap(id, body.cara_keluar, body.catatan_pulang);
    if (kode !== 0) {
      throw ApiError.conflict(`Proses pulang gagal (kode ${kode})`);
    }
    return { rawat_inap_id: id, kode_hasil: kode };
  }

  async visite(
    kunjunganId: string,
    body: VisiteBody,
    stafId: string | null
  ): Promise<Record<string, unknown>> {
    const row = await this.repository.createVisite(kunjunganId, stafId, body.catatan);
    if (!row) {
      throw ApiError.internal('Gagal menyimpan visite');
    }
    return row;
  }

  async triase(
    kunjunganId: string,
    body: TriaseBody,
    stafId: string | null
  ): Promise<Record<string, unknown>> {
    const row = await this.repository.createTriase({
      kunjunganId,
      stafId,
      level: body.level,
      keluhanUtama: body.keluhan_utama,
      keputusan: body.keputusan
    });
    if (!row) {
      throw ApiError.internal('Gagal menyimpan triase');
    }
    return row;
  }

  listIgdAntrean(): Promise<Record<string, unknown>[]> {
    return this.repository.listIgdAntrean();
  }

  listOperasi(body: RanapListInput): Promise<Record<string, unknown>[]> {
    return this.repository.listOperasi(paginate(body.limit, 100, 300));
  }

  async createOperasi(kunjunganId: string, body: OperasiBody): Promise<Record<string, unknown>> {
    const bentrok = await this.repository.countOperasiBentrok(body.ruangan_id, body.jadwal_mulai);
    if (bentrok > 0) {
      throw ApiError.conflict('Jadwal kamar operasi bentrok');
    }
    const row = await this.repository.createOperasi({
      kunjunganId,
      layananId: body.layanan_id,
      ruanganId: body.ruangan_id,
      jenisAnestesi: body.jenis_anestesi,
      jadwalMulai: body.jadwal_mulai
    });
    if (!row) {
      throw ApiError.internal('Gagal membuat jadwal operasi');
    }
    return row;
  }

  async updateOperasi(id: string, body: OperasiUpdateBody): Promise<Record<string, unknown>> {
    if (Object.keys(body).length === 0) {
      throw ApiError.validation('Tidak ada perubahan');
    }
    const row = await this.repository.updateOperasi(id, body as Record<string, unknown>);
    if (!row) {
      throw ApiError.notFound('Operasi tidak ditemukan');
    }
    return row;
  }

  listAmbulans(): Promise<Record<string, unknown>[]> {
    return this.repository.listAmbulans();
  }

  async createAmbulans(body: AmbulansBody): Promise<Record<string, unknown>> {
    const row = await this.repository.createAmbulans({
      asetId: body.aset_id,
      platNomor: body.plat_nomor,
      jenis: body.jenis,
      tahun: body.tahun,
      kapasitas: body.kapasitas,
      status: body.status,
      tglKirBerikutnya: body.tgl_kir_berikutnya
    });
    if (!row) {
      throw ApiError.internal('Gagal menyimpan ambulans');
    }
    return row;
  }

  async createPerjalanan(
    ambulansId: string,
    body: PerjalananBody,
    sopirStafId: string | null
  ): Promise<Record<string, unknown>> {
    if (!sopirStafId) {
      throw ApiError.forbidden('Perjalanan ambulans memerlukan akun staf');
    }
    const row = await this.repository.createPerjalanan({
      ambulansId,
      pasienId: body.pasien_id,
      kunjunganId: body.kunjungan_id,
      layananId: body.layanan_id,
      sopirStafId,
      asal: body.asal,
      tujuan: body.tujuan,
      waktuBerangkat: body.waktu_berangkat,
      jarakKm: body.jarak_km
    });
    if (!row) {
      throw ApiError.internal('Gagal menyimpan perjalanan ambulans');
    }
    return row;
  }

  listPerjalanan(body: RanapListInput): Promise<Record<string, unknown>[]> {
    return this.repository.listPerjalanan(paginate(body.limit, 100, 300));
  }
}

export default RanapService;
