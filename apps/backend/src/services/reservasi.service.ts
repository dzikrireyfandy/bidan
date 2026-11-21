import ApiError from '../errors/ApiError';
import { paginate } from '../validation/common';
import ReservasiRepository from '../repositories/reservasi.repository';
import type {
  JadwalBody,
  JadwalUlangBody,
  JadwalUpdateBody,
  ReservasiListInput,
  StatusBody
} from '../validation/reservasi';

export class ReservasiService {
  constructor(private readonly repository: ReservasiRepository = new ReservasiRepository()) {}

  list(body: ReservasiListInput): Promise<Record<string, unknown>[]> {
    return this.repository.list(paginate(body.limit, 100, 200), body.tanggal ?? null);
  }

  async reschedule(id: string, body: JadwalUlangBody): Promise<Record<string, unknown>> {
    const slot = await this.repository.findJadwal(body.jadwal_id);
    if (!slot) {
      throw ApiError.notFound('Jadwal tidak ditemukan');
    }
    const row = await this.repository.reschedule(id, {
      jadwalId: body.jadwal_id,
      nomor: body.nomor_antrean,
      jam: body.estimasi_jam
    });
    if (!row) {
      throw ApiError.notFound('Reservasi tidak ditemukan');
    }
    return row;
  }

  async cancel(id: string): Promise<Record<string, unknown>> {
    const row = await this.repository.cancel(id);
    if (!row) {
      throw ApiError.notFound('Reservasi tidak ditemukan');
    }
    return row;
  }

  async updateStatus(id: string, body: StatusBody): Promise<Record<string, unknown>> {
    const row = await this.repository.updateStatus(id, body.status);
    if (!row) {
      throw ApiError.notFound('Reservasi tidak ditemukan');
    }
    return row;
  }

  listJadwal(body: ReservasiListInput): Promise<Record<string, unknown>[]> {
    return this.repository.listJadwal(paginate(body.limit, 100, 200), body.tanggal ?? null);
  }

  async createJadwal(body: JadwalBody, stafDariToken: string | null): Promise<Record<string, unknown>> {
    const stafId = body.staf_id ?? stafDariToken;
    if (!stafId || !body.unit_id || !body.ruangan_id) {
      throw ApiError.validation('staf_id, unit_id, dan ruangan_id wajib diisi');
    }
    const row = await this.repository.createJadwal({
      stafId,
      unitId: body.unit_id,
      ruanganId: body.ruangan_id,
      tanggal: body.tanggal,
      jamMulai: body.jam_mulai,
      jamSelesai: body.jam_selesai,
      kuotaMaks: body.kuota_maks,
      durasi: body.durasi_per_pasien
    });
    if (!row) {
      throw ApiError.internal('Gagal membuat jadwal praktik');
    }
    return row;
  }

  async updateJadwal(id: string, body: JadwalUpdateBody): Promise<Record<string, unknown>> {
    if (Object.keys(body).length === 0) {
      throw ApiError.validation('Tidak ada perubahan');
    }
    const row = await this.repository.updateJadwal(id, body as Record<string, unknown>);
    if (!row) {
      throw ApiError.notFound('Jadwal tidak ditemukan');
    }
    return row;
  }
}

export default ReservasiService;
