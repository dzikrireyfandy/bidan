import db from '../db/pool';

export interface OperasiBaru {
  kunjunganId: string;
  layananId: string;
  ruanganId: string;
  jenisAnestesi: string;
  jadwalMulai: string;
}

export interface AmbulansBaru {
  asetId?: string;
  platNomor: string;
  jenis: string;
  tahun: number;
  kapasitas: number;
  status: string;
  tglKirBerikutnya?: string;
}

export interface PerjalananBaru {
  ambulansId: string;
  pasienId: string;
  kunjunganId?: string;
  layananId: string;
  sopirStafId: string;
  asal: string;
  tujuan: string;
  waktuBerangkat?: string;
  jarakKm?: number;
}

export class RanapRepository {
  async listTempatTidur(limit: number): Promise<Record<string, unknown>[]> {
    const result = await db.query<Record<string, unknown>>(
      `SELECT TOP (@limit) tt.bed_id, tt.no_bed, tt.status, tt.ruangan_id, r.nama AS ruangan,
              k.kode AS kelas
         FROM [Tempat_Tidur] tt
         LEFT JOIN [Ruangan] r ON r.ruangan_id = tt.ruangan_id
         LEFT JOIN [Kelas_Perawatan] k ON k.kelas_id = tt.kelas_id
        ORDER BY r.nama ASC, tt.no_bed ASC`,
      { limit }
    );
    return result.recordset;
  }

  async findBedStatus(bedId: string): Promise<string | null> {
    const result = await db.query<{ status: string }>(
      `SELECT status FROM [Tempat_Tidur] WHERE bed_id = @id`,
      { id: bedId }
    );
    return result.recordset[0]?.status ?? null;
  }

  async createRawatInap(kunjunganId: string, bedId: string): Promise<Record<string, unknown> | undefined> {
    const result = await db.query<Record<string, unknown>>(
      `INSERT INTO [Rawat_Inap] (kunjungan_id, bed_id, tgl_masuk)
       OUTPUT INSERTED.*
       VALUES (@kunjungan_id, @bed_id, SYSDATETIME())`,
      { kunjungan_id: kunjunganId, bed_id: bedId }
    );
    return result.recordset[0];
  }

  async setBedStatus(bedId: string, status: string): Promise<void> {
    await db.query(`UPDATE [Tempat_Tidur] SET status = @status WHERE bed_id = @id`, {
      id: bedId,
      status
    });
  }

  async findRawatInapBed(id: string): Promise<string | null> {
    const result = await db.query<{ bed_id: string }>(
      `SELECT bed_id FROM [Rawat_Inap] WHERE rawat_inap_id = @id`,
      { id }
    );
    return result.recordset[0]?.bed_id ?? null;
  }

  async pindahBed(id: string, bedId: string, alasan?: string): Promise<Record<string, unknown> | undefined> {
    const result = await db.query<Record<string, unknown>>(
      `UPDATE [Rawat_Inap] SET bed_id = @bed_id, alasan_pindah = @alasan
       OUTPUT INSERTED.* WHERE rawat_inap_id = @id`,
      { id, bed_id: bedId, alasan: alasan ?? null }
    );
    return result.recordset[0];
  }

  async pulangRawatInap(id: string, caraKeluar: string, catatan?: string): Promise<number> {
    const result = await db.query<{ kode_hasil: number }>(
      `DECLARE @kode INT;
       EXEC [dbo].[sp_pulang_rawat_inap]
            @rawat_inap_id = @id, @cara_keluar = @cara,
            @catatan_pulang = @catatan, @kode_hasil = @kode OUTPUT;
       SELECT @kode AS kode_hasil;`,
      { id, cara: caraKeluar, catatan: catatan ?? null }
    );
    return result.recordset[0]?.kode_hasil ?? -1;
  }

  async createVisite(
    kunjunganId: string,
    stafId: string | null,
    catatan: string
  ): Promise<Record<string, unknown> | undefined> {
    const result = await db.query<Record<string, unknown>>(
      `INSERT INTO [Visite] (kunjungan_id, staf_id, waktu, catatan)
       OUTPUT INSERTED.*
       VALUES (@kunjungan_id, @staf_id, SYSDATETIME(), @catatan)`,
      { kunjungan_id: kunjunganId, staf_id: stafId, catatan }
    );
    return result.recordset[0];
  }

  async createTriase(input: {
    kunjunganId: string;
    stafId: string | null;
    level: string;
    keluhanUtama: string;
    keputusan?: string;
  }): Promise<Record<string, unknown> | undefined> {
    const result = await db.query<Record<string, unknown>>(
      `INSERT INTO [Triase] (kunjungan_id, staf_id, level, keluhan_utama, waktu, keputusan)
       OUTPUT INSERTED.*
       VALUES (@kunjungan_id, @staf_id, @level, @keluhan, SYSDATETIME(), @keputusan)`,
      {
        kunjungan_id: input.kunjunganId,
        staf_id: input.stafId,
        level: input.level,
        keluhan: input.keluhanUtama,
        keputusan: input.keputusan ?? null
      }
    );
    return result.recordset[0];
  }

  async listIgdAntrean(): Promise<Record<string, unknown>[]> {
    const result = await db.query<Record<string, unknown>>(
      `SELECT t.triase_id, t.level, t.keluhan_utama, t.waktu, k.kunjungan_id, p.nama AS nama_pasien
         FROM [Triase] t
         JOIN [Kunjungan] k ON k.kunjungan_id = t.kunjungan_id
         JOIN [Pasien] p ON p.pasien_id = k.pasien_id
        WHERE k.status <> 'SELESAI'
        ORDER BY t.level ASC, t.waktu ASC`
    );
    return result.recordset;
  }

  async listOperasi(limit: number): Promise<Record<string, unknown>[]> {
    const result = await db.query<Record<string, unknown>>(
      `SELECT TOP (@limit) o.*, p.nama AS nama_pasien, r.nama AS ruangan
         FROM [Operasi] o
         JOIN [Kunjungan] k ON k.kunjungan_id = o.kunjungan_id
         JOIN [Pasien] p ON p.pasien_id = k.pasien_id
         LEFT JOIN [Ruangan] r ON r.ruangan_id = o.ruangan_id
        ORDER BY o.jadwal_mulai DESC`,
      { limit }
    );
    return result.recordset;
  }

  async countOperasiBentrok(ruanganId: string, jadwal: string): Promise<number> {
    const result = await db.query<{ jumlah: number }>(
      `SELECT COUNT(*) AS jumlah FROM [Operasi]
        WHERE ruangan_id = @ruangan AND status NOT IN ('SELESAI', 'BATAL')
          AND jadwal_mulai = CAST(@jadwal AS DATETIME2)`,
      { ruangan: ruanganId, jadwal }
    );
    return result.recordset[0]?.jumlah ?? 0;
  }

  async createOperasi(input: OperasiBaru): Promise<Record<string, unknown> | undefined> {
    const result = await db.query<Record<string, unknown>>(
      `INSERT INTO [Operasi] (kunjungan_id, layanan_id, ruangan_id, jenis_anestesi, jadwal_mulai, waktu_mulai, status)
       OUTPUT INSERTED.*
       VALUES (@kunjungan_id, @layanan, @ruangan, @anestesi, CAST(@jadwal AS DATETIME2), CAST(@jadwal AS DATETIME2), 'DIJADWALKAN')`,
      {
        kunjungan_id: input.kunjunganId,
        layanan: input.layananId,
        ruangan: input.ruanganId,
        anestesi: input.jenisAnestesi,
        jadwal: input.jadwalMulai
      }
    );
    return result.recordset[0];
  }

  async updateOperasi(
    id: string,
    values: Record<string, unknown>
  ): Promise<Record<string, unknown> | undefined> {
    const allowed = ['waktu_mulai', 'waktu_selesai', 'status', 'laporan'];
    const keys = Object.keys(values);
    for (const key of keys) {
      if (!allowed.includes(key)) {
        throw new Error(`Kolom operasi tidak valid: ${key}`);
      }
    }
    const assignments = keys
      .map((key) => (key.startsWith('waktu_') ? `${key} = CAST(@${key} AS DATETIME2)` : `${key} = @${key}`))
      .join(', ');
    const result = await db.query<Record<string, unknown>>(
      `UPDATE [Operasi] SET ${assignments} OUTPUT INSERTED.* WHERE operasi_id = @id`,
      { ...values, id }
    );
    return result.recordset[0];
  }

  async listAmbulans(): Promise<Record<string, unknown>[]> {
    const result = await db.query<Record<string, unknown>>(
      `SELECT ambulans_id, aset_id, plat_nomor, jenis, tahun, kapasitas, status, tgl_kir_berikutnya
         FROM [Ambulans] ORDER BY plat_nomor ASC`
    );
    return result.recordset;
  }

  async createAmbulans(input: AmbulansBaru): Promise<Record<string, unknown> | undefined> {
    const result = await db.query<Record<string, unknown>>(
      `INSERT INTO [Ambulans] (aset_id, plat_nomor, jenis, tahun, kapasitas, status, tgl_kir_berikutnya)
       OUTPUT INSERTED.*
       VALUES (@aset, @plat, @jenis, @tahun, @kapasitas, @status, @kir)`,
      {
        aset: input.asetId ?? null,
        plat: input.platNomor,
        jenis: input.jenis,
        tahun: input.tahun,
        kapasitas: input.kapasitas,
        status: input.status,
        kir: input.tglKirBerikutnya ?? null
      }
    );
    return result.recordset[0];
  }

  async createPerjalanan(input: PerjalananBaru): Promise<Record<string, unknown> | undefined> {
    const result = await db.query<Record<string, unknown>>(
      `INSERT INTO [Perjalanan_Ambulans]
         (ambulans_id, pasien_id, kunjungan_id, layanan_id, sopir_staf_id, asal, tujuan, waktu_berangkat, jarak_km, status)
       OUTPUT INSERTED.*
       VALUES (@ambulans_id, @pasien, @kunjungan, @layanan, @sopir, @asal, @tujuan,
               ISNULL(CAST(@berangkat AS DATETIME2), SYSDATETIME()), @jarak, 'BERANGKAT')`,
      {
        ambulans_id: input.ambulansId,
        pasien: input.pasienId,
        kunjungan: input.kunjunganId ?? null,
        layanan: input.layananId,
        sopir: input.sopirStafId,
        asal: input.asal,
        tujuan: input.tujuan,
        berangkat: input.waktuBerangkat ?? null,
        jarak: input.jarakKm ?? null
      }
    );
    return result.recordset[0];
  }

  async listPerjalanan(limit: number): Promise<Record<string, unknown>[]> {
    const result = await db.query<Record<string, unknown>>(
      `SELECT TOP (@limit) pj.*, a.plat_nomor
         FROM [Perjalanan_Ambulans] pj
         JOIN [Ambulans] a ON a.ambulans_id = pj.ambulans_id
        ORDER BY pj.waktu_berangkat DESC`,
      { limit }
    );
    return result.recordset;
  }
}

export default RanapRepository;
