import db from '../db/pool';

export interface PasienRingkas {
  pasien_id: string;
  no_rm: string;
  nama: string;
}

export interface JadwalSlot {
  jam_mulai: string;
  durasi_per_pasien: number;
  kuota_maks: number;
}

export class PublicRepository {
  async listKonten(limit: number, tipe: string | null): Promise<Record<string, unknown>[]> {
    const result = await db.query<Record<string, unknown>>(
      `SELECT TOP (@limit) konten_id, tipe, judul, isi, media_url, urutan, updated_at
         FROM [Konten_Publik]
        WHERE terbit = 1 AND (@tipe IS NULL OR tipe = @tipe)
        ORDER BY urutan ASC`,
      { limit, tipe }
    );
    return result.recordset;
  }

  async listLayanan(limit: number, unitId: string | null): Promise<Record<string, unknown>[]> {
    const result = await db.query<Record<string, unknown>>(
      `SELECT TOP (@limit) layanan_id, unit_id, kode, nama, kategori, satuan, kode_icd9
         FROM [Layanan_Medis]
        WHERE aktif = 1 AND (@unit_id IS NULL OR unit_id = @unit_id)
        ORDER BY nama ASC`,
      { limit, unit_id: unitId }
    );
    return result.recordset;
  }

  async listJadwal(limit: number, unitId: string | null): Promise<Record<string, unknown>[]> {
    const result = await db.query<Record<string, unknown>>(
      `SELECT TOP (@limit) j.jadwal_id, j.staf_id, j.unit_id, j.ruangan_id, j.tanggal,
              j.jam_mulai, j.jam_selesai, j.kuota_maks, j.durasi_per_pasien,
              CASE WHEN j.kuota_maks - ISNULL((
                     SELECT COUNT(*) FROM [Reservasi] r
                      WHERE r.jadwal_id = j.jadwal_id
                        AND r.status NOT IN ('BATAL', 'TIDAK_HADIR')
                   ), 0) < 0 THEN 0
                   ELSE j.kuota_maks - ISNULL((
                     SELECT COUNT(*) FROM [Reservasi] r
                      WHERE r.jadwal_id = j.jadwal_id
                        AND r.status NOT IN ('BATAL', 'TIDAK_HADIR')
                   ), 0)
              END AS sisa_kuota
         FROM [Jadwal_Praktik] j
        WHERE j.aktif = 1 AND j.tanggal >= CAST(SYSDATETIME() AS DATE)
          AND (@unit_id IS NULL OR j.unit_id = @unit_id)
        ORDER BY j.tanggal ASC, j.jam_mulai ASC`,
      { limit, unit_id: unitId }
    );
    return result.recordset;
  }

  async findPasien(nik: string | null, noRm: string | null): Promise<PasienRingkas | undefined> {
    const result = await db.query<PasienRingkas>(
      `SELECT TOP 1 pasien_id, no_rm, nama FROM [Pasien]
        WHERE nik = @nik OR no_rm = @no_rm`,
      { nik, no_rm: noRm }
    );
    return result.recordset[0];
  }

  async findJadwalSlot(jadwalId: string): Promise<JadwalSlot | undefined> {
    const result = await db.query<JadwalSlot>(
      `SELECT jam_mulai, durasi_per_pasien, kuota_maks FROM [Jadwal_Praktik]
        WHERE jadwal_id = @id AND aktif = 1 AND tanggal >= CAST(SYSDATETIME() AS DATE)`,
      { id: jadwalId }
    );
    return result.recordset[0];
  }

  async countReservasi(jadwalId: string): Promise<number> {
    const result = await db.query<{ jumlah: number }>(
      `SELECT COUNT(*) AS jumlah FROM [Reservasi]
        WHERE jadwal_id = @id AND status NOT IN ('BATAL', 'TIDAK_HADIR')`,
      { id: jadwalId }
    );
    return result.recordset[0]?.jumlah ?? 0;
  }

  async createReservasi(input: {
    pasienId: string;
    jadwalId: string;
    layananId: string;
    nomor: number;
    offset: number;
    jam: string;
    metode: string;
  }): Promise<Record<string, unknown> | undefined> {
    const result = await db.query<Record<string, unknown>>(
      `INSERT INTO [Reservasi]
         (pasien_id, jadwal_id, layanan_id, nomor_antrean, estimasi_jam, status, metode_daftar)
       OUTPUT INSERTED.reservasi_id, INSERTED.nomor_antrean, INSERTED.estimasi_jam
       VALUES (@pasien_id, @jadwal_id, @layanan_id, @nomor,
               DATEADD(MINUTE, @offset, CAST(@jam AS TIME(0))), 'MENUNGGU', @metode)`,
      {
        pasien_id: input.pasienId,
        jadwal_id: input.jadwalId,
        layanan_id: input.layananId,
        nomor: input.nomor,
        offset: input.offset,
        jam: input.jam,
        metode: input.metode
      }
    );
    return result.recordset[0];
  }
}

export default PublicRepository;
