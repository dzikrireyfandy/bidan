import { randomUUID } from 'node:crypto';
import type sql from 'mssql';
import db from '../db/pool';
import ApiError from '../errors/ApiError';

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

  async #resolveOrCreateDiagnosaInTx(
    tx: sql.Transaction,
    opts: { diagnosaId?: string; kodeIcd?: string; nama?: string }
  ): Promise<{ diagnosaId: string; kodeIcd: string | null; nama: string }> {
    if (opts.diagnosaId) {
      const byId = await db.queryInTx<{ diagnosa_id: string; kode_icd: string | null; nama: string }>(
        tx,
        `SELECT TOP 1 diagnosa_id, kode_icd, nama FROM [Diagnosa] WHERE diagnosa_id = @id`,
        { id: opts.diagnosaId }
      );
      if (byId.recordset[0]) {
        return {
          diagnosaId: byId.recordset[0].diagnosa_id,
          kodeIcd: byId.recordset[0].kode_icd,
          nama: byId.recordset[0].nama
        };
      }
    }

    const cleanKode = (opts.kodeIcd ?? '').trim().slice(0, 30);
    const cleanNama = (opts.nama ?? '').trim().slice(0, 100);

    if (cleanKode) {
      const byKode = await db.queryInTx<{ diagnosa_id: string; kode_icd: string | null; nama: string }>(
        tx,
        `SELECT TOP 1 diagnosa_id, kode_icd, nama FROM [Diagnosa] WHERE LOWER(kode_icd) = LOWER(@kode)`,
        { kode: cleanKode }
      );
      if (byKode.recordset[0]) {
        return {
          diagnosaId: byKode.recordset[0].diagnosa_id,
          kodeIcd: byKode.recordset[0].kode_icd,
          nama: byKode.recordset[0].nama
        };
      }
    }

    if (cleanNama) {
      const byNama = await db.queryInTx<{ diagnosa_id: string; kode_icd: string | null; nama: string }>(
        tx,
        `SELECT TOP 1 diagnosa_id, kode_icd, nama FROM [Diagnosa] WHERE LOWER(nama) = LOWER(@nama)`,
        { nama: cleanNama }
      );
      if (byNama.recordset[0]) {
        return {
          diagnosaId: byNama.recordset[0].diagnosa_id,
          kodeIcd: byNama.recordset[0].kode_icd,
          nama: byNama.recordset[0].nama
        };
      }

      const newDiagId = randomUUID().toUpperCase();
      const kodeVal = cleanKode || null;
      await db.queryInTx(
        tx,
        `INSERT INTO [Diagnosa] (diagnosa_id, kode_icd, nama)
         VALUES (@id, @kode, @nama)`,
        { id: newDiagId, kode: kodeVal, nama: cleanNama }
      );
      return { diagnosaId: newDiagId, kodeIcd: kodeVal, nama: cleanNama };
    }

    // Fallback ke diagnosis pemeriksaan kebidanan standar (Z34.8)
    const fallback = await db.queryInTx<{ diagnosa_id: string; kode_icd: string | null; nama: string }>(
      tx,
      `SELECT TOP 1 diagnosa_id, kode_icd, nama
         FROM [Diagnosa]
        WHERE kode_icd = 'Z34.8'
        ORDER BY diagnosa_id ASC`
    );
    if (fallback.recordset[0]) {
      return {
        diagnosaId: fallback.recordset[0].diagnosa_id,
        kodeIcd: fallback.recordset[0].kode_icd,
        nama: fallback.recordset[0].nama
      };
    }

    const defaultDiagId = randomUUID().toUpperCase();
    const defaultNama = 'Pengawasan Kehamilan Normal Rutin (ANC Terpadu)';
    await db.queryInTx(
      tx,
      `INSERT INTO [Diagnosa] (diagnosa_id, kode_icd, nama)
       VALUES (@id, 'Z34.8', @nama)`,
      { id: defaultDiagId, nama: defaultNama }
    );
    return { diagnosaId: defaultDiagId, kodeIcd: 'Z34.8', nama: defaultNama };
  }

  async simpanRme(input: {
    pasien_id: string;
    kunjungan_id?: string;
    koreksi_dari_id?: string;
    reservasi_id?: string;
    staf_id?: string;
    keluhan: string;
    pemeriksaan_fisik?: string;
    asesmen?: string;
    rencana?: string;
    catatan_bebas?: string;
    sistolik?: number;
    diastolik?: number;
    nadi?: number;
    suhu?: number;
    berat_badan?: number;
    tinggi_badan?: number;
    djj?: number;
    tinggi_fundus?: number;
    usia_kehamilan?: string;
    diagnosa_id?: string;
    diagnosa?: string;
    kode_icd10?: string;
    diagnosa_tambahan?: Array<{
      diagnosa_id?: string;
      kode_icd?: string;
      nama: string;
      jenis?: 'UTAMA' | 'SEKUNDER' | 'KOMPLIKASI';
      keterangan?: string;
    }>;
    tindakan_resep?: string;
    protokol_tambahan?: string;
    catatan_edukasi?: string;
    tgl_kontrol_ulang?: string;
    layanan_id?: string;
    layanan_ids?: string[];
    override_alergi?: boolean;
    alasan_override?: string;
    resep_obat?: Array<{
      obat_id: string;
      qty: number;
      aturan_pakai?: string;
      harga_satuan?: number;
    }>;
    stafId: string | null;
  }): Promise<Record<string, unknown>> {
    return db.transaction(async (tx) => {
      // 1. Pastikan pasien terdaftar
      const pasienRes = await db.queryInTx<{ pasien_id: string }>(
        tx,
        `SELECT TOP 1 pasien_id FROM [Pasien] WHERE pasien_id = @pid`,
        { pid: input.pasien_id }
      );
      if (!pasienRes.recordset[0]?.pasien_id) {
        throw ApiError.fromCode('ERR-RME-04');
      }

      // 2. Konsolidasi item resep obat unik per obat_id
      const consolidatedObatMap = new Map<
        string,
        { obat_id: string; qty: number; aturan_pakai: string; harga_satuan?: number }
      >();
      for (const raw of input.resep_obat ?? []) {
        const qty = Math.max(1, Math.trunc(Number(raw.qty) || 1));
        const existing = consolidatedObatMap.get(raw.obat_id);
        if (existing) {
          existing.qty += qty;
          if (raw.aturan_pakai && raw.aturan_pakai !== 'Sesuai anjuran bidan') {
            existing.aturan_pakai = raw.aturan_pakai;
          }
          if (raw.harga_satuan && raw.harga_satuan > 0) {
            existing.harga_satuan = raw.harga_satuan;
          }
        } else {
          consolidatedObatMap.set(raw.obat_id, {
            obat_id: raw.obat_id,
            qty,
            aturan_pakai: (raw.aturan_pakai || 'Sesuai anjuran bidan').slice(0, 255),
            harga_satuan: raw.harga_satuan
          });
        }
      }
      const resepItems = [...consolidatedObatMap.values()];

      // 3. Pengecekan Red-Flag Alergi Obat (Alergi_Kondisi) sebelum menulis apa pun
      if (resepItems.length > 0) {
        const alergiRes = await db.queryInTx<{
          obat_id: string | null;
          nama: string;
          kategori: string;
        }>(
          tx,
          `SELECT obat_id, nama, kategori
             FROM [Alergi_Kondisi]
            WHERE pasien_id = @pid
              AND aktif = 1
              AND kategori = 'ALERGI_OBAT'`,
          { pid: input.pasien_id }
        );
        const daftarAlergi = alergiRes.recordset;

        const matchedAlergi: string[] = [];
        for (const item of resepItems) {
          const obatRes = await db.queryInTx<{
            obat_id: string;
            nama_generik: string;
            nama_dagang: string;
            golongan: string;
          }>(
            tx,
            `SELECT TOP 1 obat_id, nama_generik, nama_dagang, golongan
               FROM [Obat]
              WHERE obat_id = @oid AND aktif = 1`,
            { oid: item.obat_id }
          );
          const obatRow = obatRes.recordset[0];
          if (!obatRow) {
            throw ApiError.fromCode('ERR-INV-02');
          }

          for (const al of daftarAlergi) {
            const sameId = al.obat_id && al.obat_id.toLowerCase() === obatRow.obat_id.toLowerCase();
            const alTerm = (al.nama || '').trim().toLowerCase();
            const gen = (obatRow.nama_generik || '').toLowerCase();
            const dag = (obatRow.nama_dagang || '').toLowerCase();
            const gol = (obatRow.golongan || '').toLowerCase();
            const textMatch =
              alTerm.length >= 3 &&
              (gen.includes(alTerm) ||
                dag.includes(alTerm) ||
                gol.includes(alTerm) ||
                alTerm.includes(gen) ||
                (alTerm.includes('penisilin') && (gen.includes('amoksisilin') || gen.includes('ampisilin'))));
            if (sameId || textMatch) {
              matchedAlergi.push(`${obatRow.nama_dagang || obatRow.nama_generik} (${al.nama})`);
            }
          }
        }

        if (matchedAlergi.length > 0) {
          if (!input.override_alergi) {
            throw ApiError.fromCode('ERR-RME-01', { obat_alergi: matchedAlergi });
          }
          if (!input.alasan_override || input.alasan_override.trim().length < 3) {
            throw ApiError.fromCode('ERR-RME-02', { obat_alergi: matchedAlergi });
          }
        }
      }

      // 4. Resolusi referensi master wajib (Staf, Unit, Penjamin, Gudang)
      const sidDefaultRes = await db.queryInTx<{ staf_id: string }>(
        tx,
        `SELECT TOP 1 staf_id FROM [Staf] WHERE aktif = 1 ORDER BY nama ASC`
      );
      const effectiveStafId = input.stafId ?? input.staf_id ?? sidDefaultRes.recordset[0]?.staf_id ?? null;
      if (!effectiveStafId) {
        throw ApiError.badRequest('Staf pemeriksa aktif tidak ditemukan');
      }

      const unitRes = await db.queryInTx<{ unit_id: string }>(
        tx,
        `SELECT TOP 1 unit_id FROM [Unit_Pelayanan] WHERE aktif = 1 ORDER BY nama ASC`
      );
      const penjaminRes = await db.queryInTx<{ penjamin_id: string }>(
        tx,
        `SELECT TOP 1 penjamin_id
           FROM [Penjamin]
          WHERE aktif = 1
          ORDER BY CASE WHEN jenis = 'MANDIRI' THEN 0 ELSE 1 END ASC`
      );
      const unitDefault = unitRes.recordset[0]?.unit_id;
      const penjaminDefault = penjaminRes.recordset[0]?.penjamin_id;
      if (!unitDefault || !penjaminDefault) {
        throw ApiError.badRequest('Data master Unit Pelayanan atau Penjamin belum tersedia');
      }

      // 5. Resolusi Kunjungan Append-Only (Kunjungan baru vs Koreksi via koreksi_dari_id)
      let kunjunganId: string;
      let koreksiDariId: string | null = input.koreksi_dari_id ?? null;
      let rootKunjunganId: string;
      let resolvedReservasiId: string | null = input.reservasi_id ?? null;
      let resolvedReservasiLayananId: string | null = null;
      let tglVisitIso: string;

      if (resolvedReservasiId) {
        const rsvCheck = await db.queryInTx<{ reservasi_id: string; layanan_id: string }>(
          tx,
          `SELECT TOP 1 reservasi_id, layanan_id FROM [Reservasi] WHERE reservasi_id = @rid AND pasien_id = @pid`,
          { rid: resolvedReservasiId, pid: input.pasien_id }
        );
        resolvedReservasiId = rsvCheck.recordset[0]?.reservasi_id ?? null;
        resolvedReservasiLayananId = rsvCheck.recordset[0]?.layanan_id ?? null;
      } else {
        const openRsv = await db.queryInTx<{ reservasi_id: string; layanan_id: string }>(
          tx,
          `SELECT TOP 1 reservasi_id, layanan_id
             FROM [Reservasi]
            WHERE pasien_id = @pid
              AND status IN ('MENUNGGU', 'DIPANGGIL')
            ORDER BY created_at DESC`,
          { pid: input.pasien_id }
        );
        resolvedReservasiId = openRsv.recordset[0]?.reservasi_id ?? null;
        resolvedReservasiLayananId = openRsv.recordset[0]?.layanan_id ?? null;
      }

      const traceRootKunjungan = async (startId: string): Promise<string> => {
        let cur = startId;
        for (let depth = 0; depth < 10; depth++) {
          const parentRes = await db.queryInTx<{ koreksi_dari_id: string | null }>(
            tx,
            `SELECT TOP 1 koreksi_dari_id FROM [Kunjungan] WHERE kunjungan_id = @cid`,
            { cid: cur }
          );
          const parentId = parentRes.recordset[0]?.koreksi_dari_id;
          if (!parentId) break;
          cur = parentId;
        }
        return cur;
      };

      if (koreksiDariId) {
        const origRes = await db.queryInTx<{
          kunjungan_id: string;
          pasien_id: string;
          reservasi_id: string | null;
          unit_id: string;
          penjamin_id: string;
          tgl_masuk_iso: string;
        }>(
          tx,
          `SELECT TOP 1 kunjungan_id, pasien_id, reservasi_id, unit_id, penjamin_id,
                  CONVERT(VARCHAR(10), tgl_masuk, 23) AS tgl_masuk_iso
             FROM [Kunjungan]
            WHERE kunjungan_id = @kid AND pasien_id = @pid AND status <> 'BATAL'`,
          { kid: koreksiDariId, pid: input.pasien_id }
        );
        const orig = origRes.recordset[0];
        if (!orig) {
          throw ApiError.fromCode('ERR-RME-04');
        }
        kunjunganId = randomUUID().toUpperCase();
        tglVisitIso = orig.tgl_masuk_iso;
        resolvedReservasiId = orig.reservasi_id ?? resolvedReservasiId;
        await db.queryInTx(
          tx,
          `INSERT INTO [Kunjungan]
             (kunjungan_id, pasien_id, reservasi_id, unit_id, dpjp_staf_id, penjamin_id, koreksi_dari_id, jenis_kunjungan, tgl_masuk, status, created_at)
           VALUES
             (@newKid, @pid, NULL, @uid, @sid, @penId, @korId, 'RAWAT_JALAN', CAST(@tglMasuk AS DATE), 'SELESAI', SYSDATETIME())`,
          {
            newKid: kunjunganId,
            pid: input.pasien_id,
            uid: orig.unit_id,
            sid: effectiveStafId,
            penId: orig.penjamin_id,
            korId: orig.kunjungan_id,
            tglMasuk: tglVisitIso
          }
        );
        rootKunjunganId = await traceRootKunjungan(orig.kunjungan_id);
      } else if (input.kunjungan_id) {
        const targetRes = await db.queryInTx<{
          kunjungan_id: string;
          pasien_id: string;
          reservasi_id: string | null;
          unit_id: string;
          penjamin_id: string;
          tgl_masuk_iso: string;
          jml_pem: number;
        }>(
          tx,
          `SELECT TOP 1 k.kunjungan_id, k.pasien_id, k.reservasi_id, k.unit_id, k.penjamin_id,
                  CONVERT(VARCHAR(10), k.tgl_masuk, 23) AS tgl_masuk_iso,
                  (SELECT COUNT(*) FROM [Pemeriksaan] p WHERE p.kunjungan_id = k.kunjungan_id) AS jml_pem
             FROM [Kunjungan] k
            WHERE k.kunjungan_id = @kid AND k.pasien_id = @pid AND k.status <> 'BATAL'`,
          { kid: input.kunjungan_id, pid: input.pasien_id }
        );
        const target = targetRes.recordset[0];
        if (!target) {
          throw ApiError.fromCode('ERR-RME-04');
        }
        tglVisitIso = target.tgl_masuk_iso;
        resolvedReservasiId = target.reservasi_id ?? resolvedReservasiId;

        if (Number(target.jml_pem) > 0) {
          // Kunjungan sudah pernah diisi RME -> aturan append-only: buat entri koreksi baru tanpa mengubah entri asal!
          koreksiDariId = target.kunjungan_id;
          kunjunganId = randomUUID().toUpperCase();
          await db.queryInTx(
            tx,
            `INSERT INTO [Kunjungan]
               (kunjungan_id, pasien_id, reservasi_id, unit_id, dpjp_staf_id, penjamin_id, koreksi_dari_id, jenis_kunjungan, tgl_masuk, status, created_at)
             VALUES
               (@newKid, @pid, NULL, @uid, @sid, @penId, @korId, 'RAWAT_JALAN', CAST(@tglMasuk AS DATE), 'SELESAI', SYSDATETIME())`,
            {
              newKid: kunjunganId,
              pid: input.pasien_id,
              uid: target.unit_id,
              sid: effectiveStafId,
              penId: target.penjamin_id,
              korId: target.kunjungan_id,
              tglMasuk: tglVisitIso
            }
          );
          rootKunjunganId = await traceRootKunjungan(target.kunjungan_id);
        } else {
          // Kunjungan check-in baru yang belum punya Pemeriksaan
          kunjunganId = target.kunjungan_id;
          await db.queryInTx(
            tx,
            `UPDATE [Kunjungan]
                SET status = 'SELESAI',
                    dpjp_staf_id = @sid,
                    reservasi_id = COALESCE(reservasi_id, @rsvId)
              WHERE kunjungan_id = @kid`,
            { kid: kunjunganId, sid: effectiveStafId, rsvId: resolvedReservasiId }
          );
          rootKunjunganId = await traceRootKunjungan(kunjunganId);
        }
      } else {
        // Kunjungan baru: cek apakah ada kunjungan check-in hari ini yang belum punya Pemeriksaan
        const todayRes = await db.queryInTx<{ today_iso: string }>(
          tx,
          `SELECT CONVERT(VARCHAR(10), CAST(SYSDATETIME() AS DATE), 23) AS today_iso`
        );
        tglVisitIso = todayRes.recordset[0]?.today_iso ?? new Date().toISOString().slice(0, 10);

        const openCheckin = await db.queryInTx<{ kunjungan_id: string; reservasi_id: string | null }>(
          tx,
          `SELECT TOP 1 k.kunjungan_id, k.reservasi_id
             FROM [Kunjungan] k
            WHERE k.pasien_id = @pid
              AND k.tgl_masuk = CAST(SYSDATETIME() AS DATE)
              AND k.koreksi_dari_id IS NULL
              AND k.status NOT IN ('SELESAI', 'BATAL')
              AND NOT EXISTS (SELECT 1 FROM [Pemeriksaan] p WHERE p.kunjungan_id = k.kunjungan_id)
            ORDER BY k.created_at DESC`,
          { pid: input.pasien_id }
        );

        if (openCheckin.recordset[0]?.kunjungan_id) {
          kunjunganId = openCheckin.recordset[0].kunjungan_id;
          resolvedReservasiId = openCheckin.recordset[0].reservasi_id ?? resolvedReservasiId;
          await db.queryInTx(
            tx,
            `UPDATE [Kunjungan]
                SET status = 'SELESAI',
                    dpjp_staf_id = @sid,
                    reservasi_id = COALESCE(reservasi_id, @rsvId)
              WHERE kunjungan_id = @kid`,
            { kid: kunjunganId, sid: effectiveStafId, rsvId: resolvedReservasiId }
          );
        } else {
          kunjunganId = randomUUID().toUpperCase();
          await db.queryInTx(
            tx,
            `INSERT INTO [Kunjungan]
               (kunjungan_id, pasien_id, reservasi_id, unit_id, dpjp_staf_id, penjamin_id, koreksi_dari_id, jenis_kunjungan, tgl_masuk, status, created_at)
             VALUES
               (@kid, @pid, @rsvId, @uid, @sid, @penId, NULL, 'RAWAT_JALAN', CAST(SYSDATETIME() AS DATE), 'SELESAI', SYSDATETIME())`,
            {
              kid: kunjunganId,
              pid: input.pasien_id,
              rsvId: resolvedReservasiId,
              uid: unitDefault,
              sid: effectiveStafId,
              penId: penjaminDefault
            }
          );
        }
        rootKunjunganId = kunjunganId;
      }

      // 6. Simpan Pemeriksaan, Tanda_Vital, dan Dokumen_Medis
      const resolvedPrimaryDiag = await this.#resolveOrCreateDiagnosaInTx(tx, {
        diagnosaId: input.diagnosa_id,
        kodeIcd: input.kode_icd10,
        nama: input.diagnosa || input.asesmen
      });

      const pemeriksaanId = randomUUID().toUpperCase();
      await db.queryInTx(
        tx,
        `INSERT INTO [Pemeriksaan]
           (pemeriksaan_id, kunjungan_id, staf_id, keluhan, pemeriksaan_fisik, asesmen, rencana, catatan_bebas, waktu)
         VALUES
           (@pemId, @kid, @sid, @keluhan, @fisik, @asesmen, @rencana, @catatan, SYSDATETIME())`,
        {
          pemId: pemeriksaanId,
          kid: kunjunganId,
          sid: effectiveStafId,
          keluhan: input.keluhan,
          fisik: input.pemeriksaan_fisik || 'Dalam batas normal',
          asesmen: input.asesmen || resolvedPrimaryDiag.nama,
          rencana: input.rencana || input.tindakan_resep || 'Konseling Asuhan Kebidanan',
          catatan: [input.protokol_tambahan, input.catatan_edukasi, input.catatan_bebas].filter(Boolean).join(' | ')
        }
      );

      await db.queryInTx(
        tx,
        `INSERT INTO [Tanda_Vital]
           (vital_id, pemeriksaan_id, sistolik, diastolik, nadi, suhu, frekuensi_napas, spo2, berat_badan, tinggi_badan, waktu)
         VALUES
           (@vitId, @pemId, @sis, @dia, @nadi, @suhu, 20, 98, @bb, @tb, SYSDATETIME())`,
        {
          vitId: randomUUID().toUpperCase(),
          pemId: pemeriksaanId,
          sis: input.sistolik ?? 120,
          dia: input.diastolik ?? 80,
          nadi: input.nadi ?? 80,
          suhu: input.suhu ?? 36.5,
          bb: input.berat_badan ?? 55,
          tb: input.tinggi_badan ?? 155
        }
      );

      const noDok = 'RME-' + Date.now().toString().slice(-6) + '-' + kunjunganId.slice(0, 4);
      const isiDoc = JSON.stringify({
        keluhan: input.keluhan,
        pemeriksaan_fisik: input.pemeriksaan_fisik,
        diagnosa_id: resolvedPrimaryDiag.diagnosaId,
        diagnosa: resolvedPrimaryDiag.nama,
        kode_icd10: resolvedPrimaryDiag.kodeIcd,
        tindakan: input.tindakan_resep || input.rencana,
        protokol_tambahan: input.protokol_tambahan,
        sistolik: input.sistolik,
        diastolik: input.diastolik,
        djj: input.djj,
        tinggi_fundus: input.tinggi_fundus,
        catatan_edukasi: input.catatan_edukasi,
        tgl_kontrol_ulang: input.tgl_kontrol_ulang,
        koreksi_dari_id: koreksiDariId
      });

      await db.queryInTx(
        tx,
        `INSERT INTO [Dokumen_Medis] (dokumen_id, kunjungan_id, staf_id, jenis, no_dokumen, isi, tgl_terbit)
         VALUES (@dokId, @kid, @sid, 'RME', @noDok, @isi, CAST(@tglVisit AS DATE))`,
        {
          dokId: randomUUID().toUpperCase(),
          kid: kunjunganId,
          sid: effectiveStafId,
          noDok,
          isi: isiDoc,
          tglVisit: tglVisitIso
        }
      );

      // 7. Tulis Kunjungan_Diagnosa (UTAMA + opsional SEKUNDER/KOMPLIKASI) tertaut ke Diagnosa
      const insertedDiagIds = new Set<string>();
      await db.queryInTx(
        tx,
        `INSERT INTO [Kunjungan_Diagnosa] (kunjungan_id, diagnosa_id, jenis, keterangan)
         VALUES (@kid, @did, 'UTAMA', @ket)`,
        {
          kid: kunjunganId,
          did: resolvedPrimaryDiag.diagnosaId,
          ket: (input.asesmen || resolvedPrimaryDiag.nama).slice(0, 255)
        }
      );
      insertedDiagIds.add(resolvedPrimaryDiag.diagnosaId.toLowerCase());

      for (const extra of input.diagnosa_tambahan ?? []) {
        const extraResolved = await this.#resolveOrCreateDiagnosaInTx(tx, {
          diagnosaId: extra.diagnosa_id,
          kodeIcd: extra.kode_icd,
          nama: extra.nama
        });
        const key = extraResolved.diagnosaId.toLowerCase();
        if (insertedDiagIds.has(key)) continue;
        insertedDiagIds.add(key);
        await db.queryInTx(
          tx,
          `INSERT INTO [Kunjungan_Diagnosa] (kunjungan_id, diagnosa_id, jenis, keterangan)
           VALUES (@kid, @did, @jenis, @ket)`,
          {
            kid: kunjunganId,
            did: extraResolved.diagnosaId,
            jenis: extra.jenis ?? 'SEKUNDER',
            ket: extra.keterangan ?? null
          }
        );
      }

      // 8. Resolusi Layanan & Tulis Tindakan_Kunjungan
      const uniqueLayananIds = new Set<string>();
      for (const lid of input.layanan_ids ?? []) {
        if (lid) uniqueLayananIds.add(lid);
      }
      if (input.layanan_id) {
        uniqueLayananIds.add(input.layanan_id);
      }
      if (uniqueLayananIds.size === 0 && resolvedReservasiLayananId) {
        uniqueLayananIds.add(resolvedReservasiLayananId);
      }
      if (uniqueLayananIds.size === 0 && koreksiDariId) {
        const prevTindakan = await db.queryInTx<{ layanan_id: string }>(
          tx,
          `SELECT layanan_id FROM [Tindakan_Kunjungan] WHERE kunjungan_id = @korId`,
          { korId: koreksiDariId }
        );
        for (const r of prevTindakan.recordset) {
          if (r.layanan_id) uniqueLayananIds.add(r.layanan_id);
        }
      }
      if (uniqueLayananIds.size === 0) {
        const defaultLay = await db.queryInTx<{ layanan_id: string }>(
          tx,
          `SELECT TOP 1 layanan_id FROM [Layanan_Medis] WHERE aktif = 1 ORDER BY nama ASC`
        );
        if (defaultLay.recordset[0]?.layanan_id) {
          uniqueLayananIds.add(defaultLay.recordset[0].layanan_id);
        }
      }

      for (const lid of uniqueLayananIds) {
        await db.queryInTx(
          tx,
          `INSERT INTO [Tindakan_Kunjungan] (tindakan_id, kunjungan_id, layanan_id, staf_id, qty, waktu)
           VALUES (@tid, @kid, @lid, @sid, 1, SYSDATETIME())`,
          {
            tid: randomUUID().toUpperCase(),
            kid: kunjunganId,
            lid,
            sid: effectiveStafId
          }
        );
      }

      // 9. Bila ini koreksi kunjungan (koreksi_dari_id), kembalikan pemakaian stok kunjungan asal yang digantikan agar tidak terpotong ganda
      const affectedObatIdsForSync = new Set<string>();
      if (koreksiDariId) {
        const prevMutasi = await db.queryInTx<{
          mutasi_id: string;
          batch_id: string;
          gudang_id: string;
          jumlah: number;
          obat_id: string;
        }>(
          tx,
          `SELECT ms.mutasi_id, ms.batch_id, ms.gudang_id, ms.jumlah, b.obat_id
             FROM [Mutasi_Stok] ms
             INNER JOIN [Batch_Obat] b ON b.batch_id = ms.batch_id
            WHERE ms.kunjungan_id = @korId
              AND ms.jenis = 'PAKAI'`,
          { korId: koreksiDariId }
        );

        const alreadyReversed = await db.queryInTx<{ jml: number }>(
          tx,
          `SELECT COUNT(*) AS jml
             FROM [Mutasi_Stok]
            WHERE jenis = 'KOREKSI'
              AND keterangan = @marker`,
          { marker: `REVERSAL_KOREKSI:${koreksiDariId}` }
        );

        if (Number(alreadyReversed.recordset[0]?.jml ?? 0) === 0 && prevMutasi.recordset.length > 0) {
          for (const pm of prevMutasi.recordset) {
            const qtyBalik = Math.abs(Number(pm.jumlah));
            if (qtyBalik <= 0) continue;
            await db.queryInTx(
              tx,
              `UPDATE [Stok_Batch]
                  SET jumlah = jumlah + @qty
                WHERE batch_id = @bid AND gudang_id = @gid`,
              { qty: qtyBalik, bid: pm.batch_id, gid: pm.gudang_id }
            );
            await db.queryInTx(
              tx,
              `INSERT INTO [Mutasi_Stok]
                 (mutasi_id, batch_id, gudang_id, kunjungan_id, staf_id, jenis, jumlah, waktu, keterangan)
               VALUES
                 (@mid, @bid, @gid, @kid, @sid, 'KOREKSI', @qty, SYSDATETIME(), @ket)`,
              {
                mid: randomUUID().toUpperCase(),
                bid: pm.batch_id,
                gid: pm.gudang_id,
                kid: kunjunganId,
                sid: effectiveStafId,
                qty: qtyBalik,
                ket: `REVERSAL_KOREKSI:${koreksiDariId}`
              }
            );
            affectedObatIdsForSync.add(pm.obat_id);
          }
        }
      }

      // 10. Tulis Resep, Resep_Detail, Pengeluaran_Obat, Pemotongan Stok_Batch FEFO, dan Mutasi_Stok ('PAKAI')
      let resepId: string | null = null;
      if (resepItems.length > 0) {
        resepId = randomUUID().toUpperCase();
        await db.queryInTx(
          tx,
          `INSERT INTO [Resep]
             (resep_id, kunjungan_id, staf_id, tanggal, status, override_alergi, alasan_override)
           VALUES
             (@rid, @kid, @sid, CAST(@tglVisit AS DATE), 'DISERAHKAN', @ovr, @alasan)`,
          {
            rid: resepId,
            kid: kunjunganId,
            sid: effectiveStafId,
            tglVisit: tglVisitIso,
            ovr: input.override_alergi ? 1 : 0,
            alasan: input.alasan_override ?? null
          }
        );

        for (const item of resepItems) {
          await db.queryInTx(
            tx,
            `INSERT INTO [Resep_Detail] (resep_id, obat_id, jumlah, aturan_pakai)
             VALUES (@rid, @oid, @qty, @aturan)`,
            {
              rid: resepId,
              oid: item.obat_id,
              qty: item.qty,
              aturan: item.aturan_pakai
            }
          );

          // Kunci baris Stok_Batch yang belum kedaluwarsa & urutkan secara FEFO (kedaluwarsa terdekat lebih dulu)
          const batchRes = await db.queryInTx<{
            batch_id: string;
            gudang_id: string;
            jumlah: number;
          }>(
            tx,
            `SELECT sb.batch_id, sb.gudang_id, sb.jumlah
               FROM [Stok_Batch] sb WITH (UPDLOCK, ROWLOCK)
               INNER JOIN [Batch_Obat] b ON b.batch_id = sb.batch_id
              WHERE b.obat_id = @oid
                AND b.tgl_kedaluwarsa >= CAST(SYSDATETIME() AS DATE)
                AND sb.jumlah > 0
              ORDER BY b.tgl_kedaluwarsa ASC, b.tgl_masuk ASC, sb.batch_id ASC`,
            { oid: item.obat_id }
          );

          const totalTersedia = batchRes.recordset.reduce((acc, b) => acc + Number(b.jumlah), 0);
          if (totalTersedia < item.qty) {
            throw ApiError.fromCode('ERR-INV-01', {
              obat_id: item.obat_id,
              diminta: item.qty,
              tersedia: totalTersedia
            });
          }

          let sisa = item.qty;
          for (const batch of batchRes.recordset) {
            if (sisa <= 0) break;
            const ambil = Math.min(sisa, Number(batch.jumlah));
            if (ambil <= 0) continue;

            const upd = await db.queryInTx(
              tx,
              `UPDATE [Stok_Batch]
                  SET jumlah = jumlah - @ambil
                WHERE batch_id = @bid
                  AND gudang_id = @gid
                  AND jumlah >= @ambil`,
              { ambil, bid: batch.batch_id, gid: batch.gudang_id }
            );
            if ((upd.rowsAffected[0] ?? 0) === 0) {
              throw ApiError.fromCode('ERR-INV-01', { obat_id: item.obat_id });
            }

            await db.queryInTx(
              tx,
              `INSERT INTO [Pengeluaran_Obat]
                 (pengeluaran_id, resep_id, obat_id, batch_id, gudang_id, apoteker_staf_id, jumlah, waktu)
               VALUES
                 (@pengId, @rid, @oid, @bid, @gid, @sid, @ambil, SYSDATETIME())`,
              {
                pengId: randomUUID().toUpperCase(),
                rid: resepId,
                oid: item.obat_id,
                bid: batch.batch_id,
                gid: batch.gudang_id,
                sid: effectiveStafId,
                ambil
              }
            );

            await db.queryInTx(
              tx,
              `INSERT INTO [Mutasi_Stok]
                 (mutasi_id, batch_id, gudang_id, kunjungan_id, staf_id, jenis, jumlah, waktu, keterangan)
               VALUES
                 (@mutId, @bid, @gid, @kid, @sid, 'PAKAI', @negAmbil, SYSDATETIME(), N'Pemakaian resep RME')`,
              {
                mutId: randomUUID().toUpperCase(),
                bid: batch.batch_id,
                gid: batch.gudang_id,
                kid: kunjunganId,
                sid: effectiveStafId,
                negAmbil: -ambil
              }
            );

            sisa -= ambil;
          }

          affectedObatIdsForSync.add(item.obat_id);
        }
      }

      // Sinkronkan kolom Obat.stok_saat_ini berdasarkan stok aktif (belum kedaluwarsa) di dalam transaksi yang sama
      for (const oid of affectedObatIdsForSync) {
        await db.queryInTx(
          tx,
          `UPDATE [Obat]
              SET stok_saat_ini = ISNULL((
                SELECT CAST(SUM(sb.jumlah) AS INT)
                  FROM [Stok_Batch] sb
                  INNER JOIN [Batch_Obat] b ON b.batch_id = sb.batch_id
                 WHERE b.obat_id = @oid
                   AND b.tgl_kedaluwarsa >= CAST(SYSDATETIME() AS DATE)
              ), 0)
            WHERE obat_id = @oid`,
          { oid }
        );
      }

      // 11. Tandai Reservasi SELESAI & Sinkronkan Tagihan + Tagihan_Rincian secara atomik (tanpa silent catch!)
      if (resolvedReservasiId) {
        await db.queryInTx(
          tx,
          `UPDATE [Reservasi]
              SET status = 'SELESAI'
            WHERE reservasi_id = @rsvId
              AND status IN ('MENUNGGU', 'DIPANGGIL')`,
          { rsvId: resolvedReservasiId }
        );
      } else {
        await db.queryInTx(
          tx,
          `UPDATE [Reservasi]
              SET status = 'SELESAI'
            WHERE pasien_id = @pid
              AND status IN ('MENUNGGU', 'DIPANGGIL')`,
          { pid: input.pasien_id }
        );
      }

      const tagRes = await db.queryInTx<{
        tagihan_id: string;
        status: string;
        total_dibayar: number;
      }>(
        tx,
        `SELECT TOP 1 tagihan_id, status, total_dibayar
           FROM [Tagihan]
          WHERE kunjungan_id = @rkid`,
        { rkid: rootKunjunganId }
      );

      let tagihanId = tagRes.recordset[0]?.tagihan_id ?? null;
      const tagihanStatus = tagRes.recordset[0]?.status ?? 'BELUM_LUNAS';
      const totalDibayarSaatIni = Number(tagRes.recordset[0]?.total_dibayar ?? 0);

      if (!tagihanId) {
        tagihanId = randomUUID().toUpperCase();
        await db.queryInTx(
          tx,
          `INSERT INTO [Tagihan] (tagihan_id, kunjungan_id, total_tagihan, total_dibayar, status, tgl_terbit)
           VALUES (@tid, @rkid, 0, 0, 'BELUM_LUNAS', CAST(@tglVisit AS DATE))`,
          { tid: tagihanId, rkid: rootKunjunganId, tglVisit: tglVisitIso }
        );
      }

      if (tagihanStatus !== 'LUNAS') {
        await db.queryInTx(tx, `DELETE FROM [Tagihan_Rincian] WHERE tagihan_id = @tid`, { tid: tagihanId });

        for (const lid of uniqueLayananIds) {
          const hrgLayRes = await db.queryInTx<{ harga: number }>(
            tx,
            `SELECT TOP 1 harga
               FROM [Harga_Layanan]
              WHERE layanan_id = @lid
                AND berlaku_dari <= CAST(@tglVisit AS DATE)
                AND (berlaku_sampai IS NULL OR berlaku_sampai >= CAST(@tglVisit AS DATE))
              ORDER BY berlaku_dari DESC`,
            { lid, tglVisit: tglVisitIso }
          );
          const hargaLayanan = Number(hrgLayRes.recordset[0]?.harga ?? 0);
          await db.queryInTx(
            tx,
            `INSERT INTO [Tagihan_Rincian] (rincian_id, tagihan_id, layanan_id, obat_id, paket_id, qty, harga_satuan, subtotal)
             VALUES (@rid, @tid, @lid, NULL, NULL, 1, @hrg, @hrg)`,
            {
              rid: randomUUID().toUpperCase(),
              tid: tagihanId,
              lid,
              hrg: hargaLayanan
            }
          );
        }

        for (const item of resepItems) {
          let hargaObat = item.harga_satuan && item.harga_satuan > 0 ? Number(item.harga_satuan) : 0;
          if (hargaObat <= 0) {
            const hrgObtRes = await db.queryInTx<{ harga_jual: number }>(
              tx,
              `SELECT TOP 1 harga_jual
                 FROM [Harga_Obat]
                WHERE obat_id = @oid
                  AND berlaku_dari <= CAST(@tglVisit AS DATE)
                  AND (berlaku_sampai IS NULL OR berlaku_sampai >= CAST(@tglVisit AS DATE))
                ORDER BY berlaku_dari DESC`,
              { oid: item.obat_id, tglVisit: tglVisitIso }
            );
            hargaObat = Number(hrgObtRes.recordset[0]?.harga_jual ?? 0);
          }

          await db.queryInTx(
            tx,
            `INSERT INTO [Tagihan_Rincian] (rincian_id, tagihan_id, layanan_id, obat_id, paket_id, qty, harga_satuan, subtotal)
             VALUES (@rid, @tid, NULL, @oid, NULL, @qty, @hrg, CAST(@hrg * @qty AS DECIMAL(14,2)))`,
            {
              rid: randomUUID().toUpperCase(),
              tid: tagihanId,
              oid: item.obat_id,
              qty: item.qty,
              hrg: hargaObat
            }
          );
        }

        const sumRes = await db.queryInTx<{ total: number }>(
          tx,
          `SELECT CAST(ISNULL(SUM(subtotal), 0) AS DECIMAL(14,2)) AS total
             FROM [Tagihan_Rincian]
            WHERE tagihan_id = @tid`,
          { tid: tagihanId }
        );
        const totalBaru = Number(sumRes.recordset[0]?.total ?? 0);
        if (totalDibayarSaatIni > totalBaru) {
          throw ApiError.fromCode('ERR-FIN-01', {
            message: 'Total rincian koreksi lebih kecil dari pembayaran yang sudah diterima'
          });
        }

        await db.queryInTx(
          tx,
          `UPDATE [Tagihan]
              SET total_tagihan = @tot,
                  status = CASE WHEN total_dibayar >= @tot AND @tot > 0 THEN 'LUNAS' ELSE 'BELUM_LUNAS' END
            WHERE tagihan_id = @tid`,
          { tot: totalBaru, tid: tagihanId }
        );
      }

      return {
        pemeriksaan_id: pemeriksaanId,
        kunjungan_id: kunjunganId,
        koreksi_dari_id: koreksiDariId,
        resep_id: resepId,
        diagnosa_id: resolvedPrimaryDiag.diagnosaId,
        kode_icd: resolvedPrimaryDiag.kodeIcd,
        diagnosa: resolvedPrimaryDiag.nama,
        tagihan_id: tagihanId,
        no_dokumen: noDok,
        waktu: new Date().toISOString()
      };
    });
  }

  async listRme(limit: number, pasienId?: string): Promise<Record<string, unknown>[]> {
    const result = await db.query<Record<string, unknown>>(
      `SELECT TOP (@limit)
              pem.pemeriksaan_id AS id,
              k.kunjungan_id,
              k.koreksi_dari_id,
              CONVERT(VARCHAR(16), pem.waktu, 120) AS waktu,
              p.pasien_id,
              p.nama AS pasien_nama,
              p.nik,
              p.no_rm,
              COALESCE(diagUtama.nama, pem.asesmen) AS diagnosa,
              diagUtama.kode_icd,
              diagUtama.diagnosa_id,
              pem.rencana AS tindakan,
              CONCAT(tv.sistolik, '/', tv.diastolik, ' mmHg') AS tekanan_darah,
              pem.keluhan,
              pem.pemeriksaan_fisik,
              COALESCE(dm.no_dokumen, 'RME-' + RIGHT(CAST(pem.pemeriksaan_id AS VARCHAR(36)), 6)) AS no_dokumen,
              dm.isi AS isi_dokumen,
              CASE WHEN EXISTS (
                SELECT 1 FROM [Kunjungan] k_kor
                 WHERE k_kor.koreksi_dari_id = k.kunjungan_id AND k_kor.status <> 'BATAL'
              ) THEN 1 ELSE 0 END AS sudah_dikoreksi
         FROM [Pemeriksaan] pem
         JOIN [Kunjungan] k ON k.kunjungan_id = pem.kunjungan_id
         JOIN [Pasien] p ON p.pasien_id = k.pasien_id
         LEFT JOIN [Tanda_Vital] tv ON tv.pemeriksaan_id = pem.pemeriksaan_id
         LEFT JOIN [Dokumen_Medis] dm ON dm.kunjungan_id = k.kunjungan_id AND dm.jenis = 'RME'
         OUTER APPLY (
           SELECT TOP 1 d.diagnosa_id, d.kode_icd, d.nama
             FROM [Kunjungan_Diagnosa] kd
             JOIN [Diagnosa] d ON d.diagnosa_id = kd.diagnosa_id
            WHERE kd.kunjungan_id = k.kunjungan_id
            ORDER BY CASE WHEN kd.jenis = 'UTAMA' THEN 0 ELSE 1 END ASC
         ) diagUtama
        WHERE (@pasien_id IS NULL OR p.pasien_id = @pasien_id)
        ORDER BY pem.waktu DESC`,
      { limit, pasien_id: pasienId ?? null }
    );
    return result.recordset;
  }
}

export default KlinisRepository;
