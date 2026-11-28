import ApiError from '../errors/ApiError';
import { paginate, periodRange } from '../validation/common';
import KeuanganRepository from '../repositories/keuangan.repository';
import type {
  BayarBody,
  HargaBody,
  RefParams,
  RekapPendapatanInput,
  TagihanListInput
} from '../validation/keuangan';

export class KeuanganService {
  constructor(private readonly repository: KeuanganRepository = new KeuanganRepository()) {}

  private pastikanStaf(stafId: string | null): string {
    if (!stafId) {
      throw ApiError.validation('Validasi gagal', [
        { path: ['staf_id'], message: 'Akun ini tidak terhubung ke data staf' }
      ]);
    }
    return stafId;
  }

  async detailTagihan(
    kunjunganId: string,
    payload?: {
      rincian?: Array<{
        layanan_id?: string | null;
        obat_id?: string | null;
        paket_id?: string | null;
        qty?: number;
        harga_satuan?: number;
        subtotal?: number;
      }>;
      pasien_id?: string;
    }
  ): Promise<Record<string, unknown>> {
    let targetKunjunganId = kunjunganId;
    if (!(await this.repository.kunjunganExists(targetKunjunganId))) {
      let fallbackKunjungan: string | null = null;
      if (typeof this.repository.findOrCreateKunjunganByPasien === 'function') {
        fallbackKunjungan = await this.repository.findOrCreateKunjunganByPasien(kunjunganId);
      }
      if (fallbackKunjungan) {
        targetKunjunganId = fallbackKunjungan;
      } else {
        throw ApiError.notFound('Kunjungan tidak ditemukan');
      }
    }
    let tagihanId = await this.repository.findTagihanIdByKunjungan(targetKunjunganId);
    if (!tagihanId) {
      tagihanId = await this.repository.createTagihan(targetKunjunganId);
    }
    if (!tagihanId) {
      throw ApiError.internal('Gagal membuat tagihan');
    }

    if (payload?.rincian && Array.isArray(payload.rincian) && payload.rincian.length > 0) {
      if (typeof this.repository.saveRincian === 'function') {
        await this.repository.saveRincian(tagihanId, payload.rincian);
      }
    }

    const [rincian, header] = await Promise.all([
      this.repository.listRincian(tagihanId),
      this.repository.findTagihan(tagihanId)
    ]);
    return { ...header, rincian };
  }

  async bayar(id: string, body: BayarBody, stafId: string | null): Promise<Record<string, unknown>> {
    let resolvedStaf = stafId ?? body.kasir_staf_id ?? null;
    if (!resolvedStaf && body.metode === 'BPJS' && typeof this.repository.findAnyActiveStaf === 'function') {
      resolvedStaf = await this.repository.findAnyActiveStaf();
    }
    const kasir = this.pastikanStaf(resolvedStaf);
    const tagihan = await this.repository.findTagihan(id);
    if (!tagihan) {
      throw ApiError.fromCode('ERR-FIN-02');
    }

    if (body.metode === 'BPJS' && typeof this.repository.ensureBpjsSupport === 'function') {
      await this.repository.ensureBpjsSupport();
    }

    let totalTagihan = Number(tagihan['total_tagihan'] ?? 0);
    const totalDibayar = Number(tagihan['total_dibayar'] ?? 0);
    if (totalTagihan <= 0 && totalDibayar === 0 && body.jumlah > 0 && typeof this.repository.syncTotalTagihanIfZero === 'function') {
      await this.repository.syncTotalTagihanIfZero(id, body.jumlah);
      totalTagihan = body.jumlah;
    }

    const sisa = totalTagihan - totalDibayar;
    if (body.jumlah > sisa) {
      throw ApiError.fromCode('ERR-FIN-01', { sisa_tagihan: sisa });
    }

    let penjaminId: string | null = body.penjamin_id ?? null;
    if (!penjaminId) {
      if (body.metode === 'BPJS') {
        penjaminId =
          (typeof this.repository.findPenjaminBpjs === 'function' ? await this.repository.findPenjaminBpjs() : null) ??
          (await this.repository.findPenjaminMandiri()) ??
          (typeof this.repository.findAnyPenjamin === 'function' ? await this.repository.findAnyPenjamin() : null);
      } else {
        penjaminId =
          (await this.repository.findPenjaminMandiri()) ??
          (typeof this.repository.findAnyPenjamin === 'function' ? await this.repository.findAnyPenjamin() : null);
      }
    }
    if (!penjaminId) {
      throw ApiError.validation('Validasi gagal', [
        { path: ['penjamin_id'], message: 'penjamin_id wajib diisi karena penjamin default tidak tersedia' }
      ]);
    }

    await this.repository.createPembayaran({
      tagihanId: id,
      penjaminId,
      kasirStafId: kasir,
      jumlah: body.jumlah,
      metode: body.metode,
      jenis: body.jenis
    });

    const dibayarBaru = totalDibayar + body.jumlah;
    const status = dibayarBaru >= totalTagihan ? 'LUNAS' : 'BELUM_LUNAS';
    const row = await this.repository.updatePembayaranTagihan(id, dibayarBaru, status);
    if (!row) {
      throw ApiError.fromCode('ERR-FIN-02');
    }
    return row;
  }

  list(body: TagihanListInput): Promise<Record<string, unknown>[]> {
    periodRange(body);
    return this.repository.listTagihan(
      paginate(body.limit, 100, 500),
      body.status ?? null,
      body.dari ?? null,
      body.sampai ?? null
    );
  }

  rekap(body: TagihanListInput): Promise<Record<string, unknown>[]> {
    periodRange(body);
    return this.repository.rekap(body.dari ?? null, body.sampai ?? null);
  }

  async rekapPendapatan(body: RekapPendapatanInput): Promise<Record<string, unknown>> {
    const jenisPeriode = body.jenis_periode ?? 'BULANAN';
    let dari = body.dari ?? null;
    let sampai = body.sampai ?? null;

    if (!dari || !sampai) {
      const ref = await this.repository.getReferensiPeriodeWib();
      if (jenisPeriode === 'HARIAN') {
        dari = dari ?? ref.hari_ini;
        sampai = sampai ?? dari;
      } else {
        dari = dari ?? ref.awal_bulan;
        sampai = sampai ?? ref.akhir_bulan;
      }
    }

    periodRange({ dari, sampai });

    const { perJalur, perTanggal } = await this.repository.rekapPendapatanPerJalur(dari, sampai);
    const mapJalur = new Map(perJalur.map((j) => [j.jalur, j]));

    const jalurStandar = (['MANDIRI', 'BPJS', 'ASURANSI'] as const).map((kode) => {
      const found = mapJalur.get(kode);
      return {
        jalur: kode,
        jumlah_transaksi: found?.jumlah_transaksi ?? 0,
        jumlah_tagihan: found?.jumlah_tagihan ?? 0,
        total_pendapatan: Number(found?.total_pendapatan ?? 0)
      };
    });

    const totalPendapatan = jalurStandar.reduce((acc, j) => acc + j.total_pendapatan, 0);
    const totalTransaksi = jalurStandar.reduce((acc, j) => acc + j.jumlah_transaksi, 0);
    const fmt = (iso: string) => {
      const [y = '', m = '', d = ''] = iso.split('-');
      return `${d}/${m}/${y}`;
    };

    const kosong = totalPendapatan === 0 && totalTransaksi === 0;

    return {
      periode: {
        jenis_periode: jenisPeriode,
        dari,
        sampai,
        dari_tampil: fmt(dari),
        sampai_tampil: fmt(sampai)
      },
      total_pendapatan: Math.round(totalPendapatan * 100) / 100,
      total_transaksi: totalTransaksi,
      kosong,
      pesan_informasi: kosong
        ? 'Tidak ada transaksi berstatus lunas pada periode yang dipilih (Total Pendapatan Rp 0).'
        : null,
      rincian_jalur: jalurStandar,
      rincian_harian: perTanggal.map((r) => ({
        ...r,
        tanggal_tampil: fmt(r.tanggal)
      }))
    };
  }

  async listHarga(): Promise<{
    layanan: Record<string, unknown>[];
    obat: Record<string, unknown>[];
    riwayat_obat?: Record<string, unknown>[];
  }> {
    const [layanan, obat, riwayatObat] = await Promise.all([
      this.repository.listHargaLayanan(),
      this.repository.listHargaObat(),
      typeof this.repository.listSemuaRiwayatHargaObat === 'function'
        ? this.repository.listSemuaRiwayatHargaObat()
        : Promise.resolve(undefined)
    ]);
    return riwayatObat !== undefined
      ? { layanan, obat, riwayat_obat: riwayatObat }
      : { layanan, obat };
  }

  async setHarga(
    params: RefParams,
    body: HargaBody,
    stafId: string | null
  ): Promise<Record<string, unknown>> {
    const staf = this.pastikanStaf(stafId);
    if (body.harga <= 0) {
      throw ApiError.fromCode('ERR-PRC-01');
    }
    if (body.berlaku_dari) {
      const hariIni = new Date().toISOString().slice(0, 10);
      if (body.berlaku_dari < hariIni) {
        throw ApiError.fromCode('ERR-PRC-01', null, 'Tanggal berlaku tidak boleh mundur');
      }
    }

    const alasan = body.alasan.trim();
    if (alasan.length < 3) {
      throw ApiError.validation('Validasi gagal', [
        { path: ['alasan'], message: 'Alasan minimal 3 karakter' }
      ]);
    }

    if (params.ref_tipe === 'LAYANAN') {
      await this.repository.closeHargaLayanan(params.ref_id);
      const created = await this.repository.insertHargaLayanan({
        layananId: params.ref_id,
        kelasId: body.kelas_id,
        penjaminId: body.penjamin_id,
        stafId: staf,
        harga: body.harga,
        berlakuDari: body.berlaku_dari,
        alasan
      });
      if (!created) {
        throw ApiError.internal('Gagal menyimpan harga layanan');
      }
      return created;
    }

    await this.repository.closeHargaObat(params.ref_id);
    const created = await this.repository.insertHargaObat({
      obatId: params.ref_id,
      stafId: staf,
      harga: body.harga,
      berlakuDari: body.berlaku_dari,
      alasan
    });
    if (!created) {
      throw ApiError.internal('Gagal menyimpan harga obat');
    }
    return created;
  }

  riwayatHarga(params: RefParams): Promise<Record<string, unknown>[]> {
    return params.ref_tipe === 'LAYANAN'
      ? this.repository.riwayatHargaLayanan(params.ref_id)
      : this.repository.riwayatHargaObat(params.ref_id);
  }
}

export default KeuanganService;
