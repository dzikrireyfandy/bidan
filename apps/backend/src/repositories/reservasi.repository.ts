import db from '../db/pool';

const JADWAL_COLUMNS = ['jam_mulai', 'jam_selesai', 'kuota_maks', 'durasi_per_pasien', 'aktif'] as const;

export class ReservasiRepository {
  async list(limit: number, tanggal: string | null): Promise<Record<string, unknown>[]> {
    const result = await db.query<Record<string, unknown>>(
      `SELECT TOP (@limit) r.reservasi_id, r.pasien_id, p.nama AS nama_pasien, r.jadwal_id,
              r.nomor_antrean, CONVERT(VARCHAR(5), r.estimasi_jam, 108) AS estimasi_jam,
              r.status, r.metode_daftar, j.tanggal
         FROM [Reservasi] r
         JOIN [Pasien] p ON p.pasien_id = r.pasien_id
         JOIN [Jadwal_Praktik] j ON j.jadwal_id = r.jadwal_id
        WHERE @tanggal IS NULL OR CAST(j.tanggal AS VARCHAR(10)) = @tanggal
        ORDER BY j.tanggal ASC, r.nomor_antrean ASC`,
      { limit, tanggal }
    );
    return result.recordset;
  }

  async findJadwal(jadwalId: string): Promise<{ jam_mulai: string } | undefined> {
    const result = await db.query<{ jam_mulai: string }>(
      `SELECT jam_mulai FROM [Jadwal_Praktik] WHERE jadwal_id = @id AND aktif = 1`,
      { id: jadwalId }
    );
    return result.recordset[0];
  }

  async reschedule(
    id: string,
    input: { jadwalId: string; nomor?: number; jam?: string }
  ): Promise<Record<string, unknown> | undefined> {
    const result = await db.query<Record<string, unknown>>(
      `UPDATE [Reservasi]
          SET jadwal_id = @jadwal_id,
              nomor_antrean = ISNULL(@nomor, nomor_antrean),
              estimasi_jam = ISNULL(@jam, estimasi_jam),
              status = 'MENUNGGU'
        OUTPUT INSERTED.*
        WHERE reservasi_id = @id`,
      {
        id,
        jadwal_id: input.jadwalId,
        nomor: input.nomor ?? null,
        jam: input.jam ?? null
      }
    );
    return result.recordset[0];
  }

  async cancel(id: string): Promise<Record<string, unknown> | undefined> {
    const result = await db.query<Record<string, unknown>>(
      `UPDATE [Reservasi] SET status = 'BATAL' OUTPUT INSERTED.* WHERE reservasi_id = @id`,
      { id }
    );
    return result.recordset[0];
  }

  async updateStatus(id: string, status: string): Promise<Record<string, unknown> | undefined> {
    const result = await db.query<Record<string, unknown>>(
      `UPDATE [Reservasi] SET status = @status OUTPUT INSERTED.* WHERE reservasi_id = @id`,
      { id, status }
    );
    return result.recordset[0];
  }

  async listJadwal(limit: number, tanggal: string | null): Promise<Record<string, unknown>[]> {
    const result = await db.query<Record<string, unknown>>(
      `SELECT TOP (@limit) j.jadwal_id, j.staf_id, j.unit_id, j.ruangan_id, j.tanggal,
              CONVERT(VARCHAR(5), j.jam_mulai, 108) AS jam_mulai,
              CONVERT(VARCHAR(5), j.jam_selesai, 108) AS jam_selesai,
              j.kuota_maks, j.durasi_per_pasien, j.aktif
         FROM [Jadwal_Praktik] j
        WHERE j.aktif = 1 AND (@tanggal IS NULL OR CAST(j.tanggal AS VARCHAR(10)) = @tanggal)
        ORDER BY j.tanggal ASC, j.jam_mulai ASC`,
      { limit, tanggal }
    );
    return result.recordset;
  }

  async createJadwal(input: {
    stafId: string;
    unitId: string;
    ruanganId: string;
    tanggal: string;
    jamMulai: string;
    jamSelesai: string;
    kuotaMaks: number;
    durasi: number;
  }): Promise<Record<string, unknown> | undefined> {
    const result = await db.query<Record<string, unknown>>(
      `INSERT INTO [Jadwal_Praktik]
         (staf_id, unit_id, ruangan_id, tanggal, jam_mulai, jam_selesai, kuota_maks, durasi_per_pasien, aktif)
       OUTPUT INSERTED.*
       VALUES (@staf_id, @unit_id, @ruangan_id, @tanggal, @jam_mulai, @jam_selesai, @kuota_maks, @durasi, 1)`,
      {
        staf_id: input.stafId,
        unit_id: input.unitId,
        ruangan_id: input.ruanganId,
        tanggal: input.tanggal,
        jam_mulai: input.jamMulai,
        jam_selesai: input.jamSelesai,
        kuota_maks: input.kuotaMaks,
        durasi: input.durasi
      }
    );
    return result.recordset[0];
  }

  async updateJadwal(
    id: string,
    values: Record<string, unknown>
  ): Promise<Record<string, unknown> | undefined> {
    const keys = Object.keys(values);
    for (const key of keys) {
      if (!JADWAL_COLUMNS.includes(key as (typeof JADWAL_COLUMNS)[number])) {
        throw new Error(`Kolom jadwal tidak valid: ${key}`);
      }
    }
    const assignments = keys.map((key) => `${key} = @${key}`).join(', ');
    const result = await db.query<Record<string, unknown>>(
      `UPDATE [Jadwal_Praktik] SET ${assignments} OUTPUT INSERTED.* WHERE jadwal_id = @id`,
      { ...values, id }
    );
    return result.recordset[0];
  }
}

export default ReservasiRepository;
