import db from '../db/pool';

export interface KunjunganInput {
  pasienId: string;
  unitId: string;
  dpjpId: string;
  penjaminId: string;
  jenis: string;
}

export interface KehamilanInput {
  hpht: string;
  gravida: number;
  paritas: number;
  abortus: number;
  statusRisiko: string;
  status: string;
}

export interface AncInput {
  kunjunganKe: number;
  minggu: number;
  tinggiFundus?: number;
  djj?: number;
  letakJanin?: string;
  tabletFe: boolean;
}

export interface PersalinanInput {
  kehamilanId: string;
  kunjunganId?: string;
  penolongId: string | null;
  waktu?: string;
  jenis: string;
  komplikasi?: string;
  kondisiIbu: string;
}

export interface BayiInput {
  persalinanId: string;
  berat: number;
  panjang: number;
  apgar1?: number;
  apgar5?: number;
  kondisi: string;
  nama: string;
  jenisKelamin: string;
  tglLahir: string;
  ibuPasienId: string;
}

export interface ImunisasiInput {
  pasienId: string;
  vaksinId: string;
  kunjunganId?: string;
  batchId?: string;
  stafId: string | null;
  dosisKe: number;
  tanggal: string;
}

export interface KbInput {
  pasienId: string;
  metodeId: string;
  kunjunganId?: string;
  tanggal: string;
  kontrolBerikutnya?: string;
  efekSamping?: string;
}

export class KlinisRepository {
  async findDokterAktif(): Promise<string | null> {
    const result = await db.query<{ staf_id: string }>(
      `SELECT TOP 1 s.staf_id FROM [Staf] s JOIN [Profesi] pr ON pr.profesi_id = s.profesi_id
        WHERE s.aktif = 1 AND pr.kode LIKE 'DOKTER%' ORDER BY s.nama ASC`
    );
    return result.recordset[0]?.staf_id ?? null;
  }

  async findPenjaminPertama(): Promise<string | null> {
    const result = await db.query<{ penjamin_id: string }>(
      `SELECT TOP 1 penjamin_id FROM [Penjamin] ORDER BY nama ASC`
    );
    return result.recordset[0]?.penjamin_id ?? null;
  }

  async createKunjungan(input: KunjunganInput): Promise<string | null> {
    const result = await db.query<{ kunjungan_id: string }>(
      `INSERT INTO [Kunjungan]
         (pasien_id, unit_id, dpjp_staf_id, penjamin_id, jenis_kunjungan, status, tgl_masuk)
       OUTPUT INSERTED.kunjungan_id
       VALUES (@pasien_id, @unit_id, @dpjp, @penjamin, @jenis, 'DILAYANI', SYSDATETIME())`,
      {
        pasien_id: input.pasienId,
        unit_id: input.unitId,
        dpjp: input.dpjpId,
        penjamin: input.penjaminId,
        jenis: input.jenis
      }
    );
    return result.recordset[0]?.kunjungan_id ?? null;
  }

  async upsertDiagnosa(kunjunganId: string, kode: string, nama: string, jenis: string): Promise<void> {
    await db.query(
      `IF NOT EXISTS (SELECT 1 FROM [Diagnosa] WHERE kode_icd = @kode)
         INSERT INTO [Diagnosa] (kode_icd, nama) VALUES (@kode, @nama);
       INSERT INTO [Kunjungan_Diagnosa] (kunjungan_id, diagnosa_id, jenis)
       SELECT TOP 1 @k, diagnosa_id, @j FROM [Diagnosa] WHERE kode_icd = @kode;`,
      { kode, nama, k: kunjunganId, j: jenis }
    );
  }

  async insertTindakan(kunjunganId: string, layananIds: string[], stafId: string): Promise<void> {
    const params: Record<string, unknown> = { k: kunjunganId, s: stafId };
    const rows = layananIds.map((id, index) => {
      params[`l${index}`] = id;
      return `(@k, @l${index}, @s, 1, SYSDATETIME())`;
    });
    await db.query(
      `INSERT INTO [Tindakan_Kunjungan] (kunjungan_id, layanan_id, staf_id, qty, waktu)
       VALUES ${rows.join(', ')}`,
      params
    );
  }

  async createCatatan(input: {
    kunjunganId: string;
    stafId: string | null;
    jenis: string;
    isi: string;
  }): Promise<Record<string, unknown> | undefined> {
    const result = await db.query<Record<string, unknown>>(
      `INSERT INTO [Catatan_Keperawatan] (kunjungan_id, staf_id, jenis, isi, waktu)
       OUTPUT INSERTED.*
       VALUES (@kunjungan_id, @staf_id, @jenis, @isi, SYSDATETIME())`,
      {
        kunjungan_id: input.kunjunganId,
        staf_id: input.stafId,
        jenis: input.jenis,
        isi: input.isi
      }
    );
    return result.recordset[0];
  }

  async listKehamilan(pasienId: string, limit: number): Promise<Record<string, unknown>[]> {
    const result = await db.query<Record<string, unknown>>(
      `SELECT TOP (@limit) * FROM [Kehamilan] WHERE pasien_id = @id ORDER BY hpht DESC`,
      { id: pasienId, limit }
    );
    return result.recordset;
  }

  async createKehamilan(pasienId: string, input: KehamilanInput): Promise<Record<string, unknown> | undefined> {
    const result = await db.query<Record<string, unknown>>(
      `INSERT INTO [Kehamilan] (pasien_id, hpht, hpl, gravida, paritas, abortus, status_risiko, status)
       OUTPUT INSERTED.*
       VALUES (@pasien_id, @hpht, DATEADD(DAY, 280, CAST(@hpht AS DATE)), @g, @p, @a, @risiko, @status)`,
      {
        pasien_id: pasienId,
        hpht: input.hpht,
        g: input.gravida,
        p: input.paritas,
        a: input.abortus,
        risiko: input.statusRisiko,
        status: input.status
      }
    );
    return result.recordset[0];
  }

  async listAnc(kehamilanId: string, limit: number): Promise<Record<string, unknown>[]> {
    const result = await db.query<Record<string, unknown>>(
      `SELECT TOP (@limit) * FROM [Pemeriksaan_ANC] WHERE kehamilan_id = @id ORDER BY kunjungan_ke DESC`,
      { id: kehamilanId, limit }
    );
    return result.recordset;
  }

  async createAnc(kehamilanId: string, input: AncInput): Promise<Record<string, unknown> | undefined> {
    const result = await db.query<Record<string, unknown>>(
      `INSERT INTO [Pemeriksaan_ANC]
         (pemeriksaan_id, kehamilan_id, kunjungan_ke, usia_kehamilan_minggu, tinggi_fundus, djj, letak_janin, tablet_fe_diberikan)
       OUTPUT INSERTED.*
       VALUES (NEWID(), @kehamilan_id, @ke, @minggu, @tf, @djj, @letak, @fe)`,
      {
        kehamilan_id: kehamilanId,
        ke: input.kunjunganKe,
        minggu: input.minggu,
        tf: input.tinggiFundus ?? null,
        djj: input.djj ?? null,
        letak: input.letakJanin ?? null,
        fe: input.tabletFe
      }
    );
    return result.recordset[0];
  }

  async createPersalinan(input: PersalinanInput): Promise<Record<string, unknown> | undefined> {
    const result = await db.query<Record<string, unknown>>(
      `INSERT INTO [Persalinan]
         (kehamilan_id, kunjungan_id, penolong_staf_id, waktu_persalinan, jenis_persalinan, komplikasi, kondisi_ibu)
       OUTPUT INSERTED.*
       VALUES (@kehamilan_id, @kunjungan_id, @penolong, ISNULL(CAST(@waktu AS DATETIME2), SYSDATETIME()), @jenis, @komplikasi, @kondisi)`,
      {
        kehamilan_id: input.kehamilanId,
        kunjungan_id: input.kunjunganId ?? null,
        penolong: input.penolongId,
        waktu: input.waktu ?? null,
        jenis: input.jenis,
        komplikasi: input.komplikasi ?? null,
        kondisi: input.kondisiIbu
      }
    );
    return result.recordset[0];
  }

  async completeKehamilan(kehamilanId: string): Promise<void> {
    await db.query(`UPDATE [Kehamilan] SET status = 'SELESAI' WHERE kehamilan_id = @id`, {
      id: kehamilanId
    });
  }

  async createPasienBayi(input: {
    nama: string;
    jenisKelamin: string;
    tglLahir: string;
    ibuPasienId: string;
  }): Promise<string | null> {
    const result = await db.query<{ pasien_id: string }>(
      `INSERT INTO [Pasien]
         (no_rm, nik, nama, jenis_kelamin, tgl_lahir, tempat_lahir, alamat, no_telepon,
          gol_darah, status_pernikahan, pekerjaan, ibu_pasien_id)
       OUTPUT INSERTED.pasien_id
       VALUES (RIGHT('000000' + CAST(NEXT VALUE FOR dbo.Seq_NoRM AS VARCHAR(10)), 6),
               @nik, @nama, @jk, @tgl, '-', '-', '-', '-', 'BELUM_MENIKAH', '-', @ibu)`,
      {
        nik: `B${Date.now()}`.slice(0, 16).padEnd(16, '0'),
        nama: input.nama,
        jk: input.jenisKelamin,
        tgl: input.tglLahir,
        ibu: input.ibuPasienId
      }
    );
    return result.recordset[0]?.pasien_id ?? null;
  }

  async createBayiLahir(input: BayiInput, pasienId: string): Promise<Record<string, unknown> | undefined> {
    const result = await db.query<Record<string, unknown>>(
      `INSERT INTO [Bayi_Lahir]
         (persalinan_id, pasien_id, berat_lahir_gram, panjang_lahir_cm, apgar_1, apgar_5, kondisi)
       OUTPUT INSERTED.*
       VALUES (@persalinan_id, @pasien_id, @berat, @panjang, @apgar1, @apgar5, @kondisi)`,
      {
        persalinan_id: input.persalinanId,
        pasien_id: pasienId,
        berat: input.berat,
        panjang: input.panjang,
        apgar1: input.apgar1 ?? null,
        apgar5: input.apgar5 ?? null,
        kondisi: input.kondisi
      }
    );
    return result.recordset[0];
  }

  async listImunisasi(pasienId: string, limit: number): Promise<Record<string, unknown>[]> {
    const result = await db.query<Record<string, unknown>>(
      `SELECT TOP (@limit) i.*, v.nama AS nama_vaksin
         FROM [Imunisasi_Pasien] i
         LEFT JOIN [Vaksin] v ON v.vaksin_id = i.vaksin_id
        WHERE i.pasien_id = @id
        ORDER BY i.tanggal DESC`,
      { id: pasienId, limit }
    );
    return result.recordset;
  }

  async createImunisasi(input: ImunisasiInput): Promise<Record<string, unknown> | undefined> {
    const result = await db.query<Record<string, unknown>>(
      `INSERT INTO [Imunisasi_Pasien] (pasien_id, vaksin_id, kunjungan_id, batch_id, staf_id, dosis_ke, tanggal)
       OUTPUT INSERTED.*
       VALUES (@pasien_id, @vaksin, @kunjungan, @batch, @staf, @dosis, @tanggal)`,
      {
        pasien_id: input.pasienId,
        vaksin: input.vaksinId,
        kunjungan: input.kunjunganId ?? null,
        batch: input.batchId ?? null,
        staf: input.stafId,
        dosis: input.dosisKe,
        tanggal: input.tanggal
      }
    );
    return result.recordset[0];
  }

  async listKb(pasienId: string, limit: number): Promise<Record<string, unknown>[]> {
    const result = await db.query<Record<string, unknown>>(
      `SELECT TOP (@limit) kb.*, m.nama AS metode
         FROM [Pelayanan_KB] kb
         LEFT JOIN [Metode_KB] m ON m.metode_id = kb.metode_id
        WHERE kb.pasien_id = @id
        ORDER BY kb.tanggal DESC`,
      { id: pasienId, limit }
    );
    return result.recordset;
  }

  async createKb(input: KbInput): Promise<Record<string, unknown> | undefined> {
    const result = await db.query<Record<string, unknown>>(
      `INSERT INTO [Pelayanan_KB] (pasien_id, metode_id, kunjungan_id, tanggal, kontrol_berikutnya, efek_samping)
       OUTPUT INSERTED.*
       VALUES (@pasien_id, @metode, @kunjungan, @tanggal, @kontrol, @efek)`,
      {
        pasien_id: input.pasienId,
        metode: input.metodeId,
        kunjungan: input.kunjunganId ?? null,
        tanggal: input.tanggal,
        kontrol: input.kontrolBerikutnya ?? null,
        efek: input.efekSamping ?? null
      }
    );
    return result.recordset[0];
  }
}

export default KlinisRepository;
