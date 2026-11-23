import ApiError from '../errors/ApiError';
import { paginate, periodRange } from '../validation/common';
import LaporanRepository from '../repositories/laporan.repository';
import type { KontenBody, KontenUpdateBody, PeriodeInput } from '../validation/laporan';

const periodeOf = (body: PeriodeInput): { dari: string | null; sampai: string | null } => {
  periodRange(body);
  return { dari: body.dari ?? null, sampai: body.sampai ?? null };
};

export class LaporanService {
  constructor(private readonly repository: LaporanRepository = new LaporanRepository()) {}

  async ringkasan(body: PeriodeInput): Promise<Record<string, unknown>> {
    const periode = periodeOf(body);
    const [kunjungan, pendapatan, rawatInap] = await Promise.all([
      this.repository.ringkasanKunjungan(periode),
      this.repository.ringkasanPendapatan(periode),
      this.repository.ringkasanRawatInap(periode)
    ]);

    const totalKunjungan = Number(kunjungan['total_kunjungan'] ?? 0);
    const totalPendapatan = Number(pendapatan['total_pendapatan'] ?? 0);
    const episode = Number(rawatInap['episode_rawat_inap'] ?? 0);
    if (totalKunjungan === 0 && totalPendapatan === 0 && episode === 0) {
      throw ApiError.fromCode('ERR-RPT-01');
    }

    return { kunjungan, pendapatan, rawat_inap: rawatInap };
  }

  trenLayanan(body: PeriodeInput): Promise<Record<string, unknown>[]> {
    const periode = periodeOf(body);
    return this.repository.trenLayanan(paginate(body.limit, 10, 200), periode);
  }

  jamTersibuk(): Promise<Record<string, unknown>[]> {
    return this.repository.jamTersibuk();
  }

  perbandingan(body: PeriodeInput): Promise<Record<string, unknown>[]> {
    return this.repository.perbandingan(periodeOf(body));
  }

  async export(body: PeriodeInput): Promise<{ format: string; rows: Record<string, unknown>[] }> {
    const rows = await this.repository.export(periodeOf(body));
    return { format: 'JSON', rows };
  }

  listKonten(body: PeriodeInput): Promise<Record<string, unknown>[]> {
    return this.repository.listKonten(paginate(body.limit, 100, 200));
  }

  async createKonten(body: KontenBody): Promise<Record<string, unknown>> {
    const row = await this.repository.createKonten(body);
    if (!row) {
      throw ApiError.internal('Gagal menyimpan konten');
    }
    return row;
  }

  async updateKonten(id: string, body: KontenUpdateBody): Promise<Record<string, unknown>> {
    if (Object.keys(body).length === 0) {
      throw ApiError.validation('Tidak ada perubahan');
    }
    const row = await this.repository.updateKonten(id, body as Record<string, unknown>);
    if (!row) {
      throw ApiError.fromCode('ERR-CNT-01');
    }
    return row;
  }

  async deleteKonten(id: string): Promise<Record<string, unknown>> {
    const row = await this.repository.softDeleteKonten(id);
    if (!row) {
      throw ApiError.fromCode('ERR-CNT-01');
    }
    return row;
  }

  listNotifikasi(body: PeriodeInput): Promise<Record<string, unknown>[]> {
    return this.repository.listNotifikasi(paginate(body.limit, 100, 200));
  }

  async kirimUlangNotifikasi(id: string): Promise<Record<string, unknown>> {
    const row = await this.repository.kirimUlangNotifikasi(id);
    if (!row) {
      throw ApiError.notFound('Log notifikasi tidak ditemukan');
    }
    return row;
  }

  listAudit(body: PeriodeInput): Promise<Record<string, unknown>[]> {
    return this.repository.listAudit(paginate(body.limit, 10000, 50000), periodeOf(body));
  }
}

export default LaporanService;
