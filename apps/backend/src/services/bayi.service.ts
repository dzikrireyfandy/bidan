import ApiError from '../errors/ApiError';
import BayiRepository from '../repositories/bayi.repository';
import type { AsuhanBody, PemeriksaanBody } from '../validation/bayi';

export class BayiService {
  constructor(private readonly repository: BayiRepository = new BayiRepository()) {}

  async createAsuhan(id: string, body: AsuhanBody, stafId: string | null): Promise<Record<string, unknown>> {
    if (!(await this.repository.findBayi(id))) {
      throw ApiError.notFound('Data bayi tidak ditemukan');
    }
    if (await this.repository.findAsuhan(id)) {
      throw ApiError.conflict('Asuhan BBL untuk bayi ini sudah dicatat');
    }

    const row = await this.repository.createAsuhan({
      bayiId: id,
      stafId,
      imd: body.imd,
      vitK1: body.vit_k1,
      salepMata: body.salep_mata,
      hb0: body.hb0,
      keadaanUmum: body.keadaan_umum,
      catatan: body.catatan
    });
    if (!row) {
      throw ApiError.internal('Gagal menyimpan asuhan BBL');
    }
    return row;
  }

  listAsuhan(id: string): Promise<Record<string, unknown>[]> {
    return this.repository.listAsuhan(id);
  }

  async createPemeriksaan(
    id: string,
    body: PemeriksaanBody,
    stafId: string | null
  ): Promise<Record<string, unknown>> {
    const row = await this.repository.createPemeriksaan({
      bayiId: id,
      kunjunganId: body.kunjungan_id,
      stafId,
      jenis: body.jenis,
      tanggal: body.tgl_pemeriksaan,
      berat: body.berat_gram,
      panjang: body.panjang_cm,
      lingkarKepala: body.lingkar_kepala_cm,
      suhu: body.suhu_c,
      taliPusat: body.kondisi_tali_pusat,
      menyusu: body.menyusu,
      ikterus: body.ikterus,
      tandaBahaya: body.tanda_bahaya,
      kontrol: body.tgl_kontrol_berikutnya,
      catatan: body.catatan
    });
    if (!row) {
      throw ApiError.internal('Gagal menyimpan pemeriksaan bayi');
    }

    if (body.tgl_kontrol_berikutnya) {
      await this.repository.enqueueKontrol(id, body.tgl_kontrol_berikutnya);
    }

    return row;
  }

  listPemeriksaan(id: string): Promise<Record<string, unknown>[]> {
    return this.repository.listPemeriksaan(id);
  }

  grafik(id: string): Promise<Record<string, unknown>[]> {
    return this.repository.grafikTumbuhKembang(id);
  }
}

export default BayiService;
