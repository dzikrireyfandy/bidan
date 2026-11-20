import db from '../db/pool';

export interface PemeliharaanBaru {
  asetId: string;
  teknisiStafId?: string;
  jenis: string;
  tanggal: string;
  biaya: number;
  hasil?: string;
  jadwalBerikutnya?: string;
}

export class AdminRepository {
  async findStaf(id: string): Promise<string | null> {
    const result = await db.query<{ staf_id: string }>(
      `SELECT TOP 1 staf_id FROM [Staf] WHERE staf_id = @id`,
      { id }
    );
    return result.recordset[0]?.staf_id ?? null;
  }

  async findPeranId(kode: string): Promise<string | null> {
    const result = await db.query<{ peran_id: string }>(
      `SELECT TOP 1 peran_id FROM [Peran] WHERE kode = @kode`,
      { kode }
    );
    return result.recordset[0]?.peran_id ?? null;
  }

  async countUsername(username: string): Promise<number> {
    const result = await db.query<{ jumlah: number }>(
      `SELECT COUNT(*) AS jumlah FROM [Akun_Pengguna] WHERE username = @username`,
      { username }
    );
    return result.recordset[0]?.jumlah ?? 0;
  }

  async createAkun(input: {
    stafId: string;
    peranId: string;
    username: string;
    passwordHash: string;
    subPeran?: string;
  }): Promise<Record<string, unknown> | undefined> {
    const result = await db.query<Record<string, unknown>>(
      `INSERT INTO [Akun_Pengguna] (staf_id, peran_id, username, password_hash, aktif, percobaan_gagal, sub_peran)
       OUTPUT INSERTED.akun_id, INSERTED.username, INSERTED.sub_peran
       VALUES (@staf_id, @peran_id, @username, @hash, 1, 0, @sub_peran)`,
      {
        staf_id: input.stafId,
        peran_id: input.peranId,
        username: input.username,
        hash: input.passwordHash,
        sub_peran: input.subPeran ?? null
      }
    );
    return result.recordset[0];
  }

  async createPemeliharaan(input: PemeliharaanBaru): Promise<Record<string, unknown> | undefined> {
    const result = await db.query<Record<string, unknown>>(
      `INSERT INTO [Pemeliharaan_Aset]
         (aset_id, teknisi_staf_id, jenis, tanggal, biaya, hasil, jadwal_berikutnya)
       OUTPUT INSERTED.*
       VALUES (@aset_id, @teknisi, @jenis, @tanggal, @biaya, @hasil, @jadwal)`,
      {
        aset_id: input.asetId,
        teknisi: input.teknisiStafId ?? null,
        jenis: input.jenis,
        tanggal: input.tanggal,
        biaya: input.biaya,
        hasil: input.hasil ?? null,
        jadwal: input.jadwalBerikutnya ?? null
      }
    );
    return result.recordset[0];
  }

  async enqueueKalibrasi(asetId: string, jadwal: string): Promise<void> {
    await db.query(
      `INSERT INTO [Notifikasi_Log] (jenis, tujuan, pesan, status, retry_count, waktu_kirim)
       SELECT 'KALIBRASI_ASET', '-',
              'Jadwal pemeliharaan aset ' + a.nama + ' pada ' + CONVERT(VARCHAR(10), @jadwal, 105),
              'ANTRE', 0, DATEADD(DAY, -1, CAST(@jadwal AS DATETIME2))
         FROM [Aset] a WHERE a.aset_id = @aset_id`,
      { jadwal, aset_id: asetId }
    );
  }
}

export default AdminRepository;
