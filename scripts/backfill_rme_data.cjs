#!/usr/bin/env node
/**
 * scripts/backfill_rme_data.cjs
 * Backfill Idempotent Data Historis Kunjungan / RME:
 * - Mode bawaan: --dry-run (hanya menampilkan dampak tanpa mengubah DB)
 * - Mode eksekusi: --execute (menjalankan perubahan secara atomik dalam 1 transaksi)
 */
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const repoRoot = path.resolve(__dirname, '..');
require(path.join(repoRoot, 'node_modules/dotenv')).config({
  path: path.join(repoRoot, '.env')
});
require(path.join(repoRoot, 'node_modules/dotenv')).config({
  path: path.join(repoRoot, 'apps/backend/.env')
});
const sql = require(path.join(repoRoot, 'node_modules/mssql'));

const args = process.argv.slice(2);
const isExecute = args.includes('--execute');
const modeLabel = isExecute ? 'EXECUTE (Tulis Atomik)' : 'DRY-RUN (Simulasi Baca Saja)';

function inferKodeIcdFromText(text) {
  const s = String(text || '').toLowerCase();
  if (s.includes('persalinan') || s.includes('partus') || s.includes('lahiran')) return 'O80';
  if (s.includes('nifas') || s.includes('pascapersalinan') || s.includes('kf')) return 'Z39.2';
  if (s.includes('laktasi') || s.includes('menyusui') || s.includes('asi')) return 'Z39.1';
  if (s.includes('suntik') || s.includes('pil')) return 'Z30.4';
  if (s.includes('iud') || s.includes('implan') || s.includes('akdr')) return 'Z30.5';
  if (s.includes('kb') || s.includes('kontrasepsi')) return 'Z30.0';
  if (s.includes('imunisasi') || s.includes('vaksin')) return 'Z23';
  if (s.includes('bayi') || s.includes('neonatal') || s.includes('anak') || s.includes('tumbuh')) return 'Z00.1';
  if (s.includes('hiperemesis') || s.includes('mual')) return 'O21.0';
  if (s.includes('hipertensi') || s.includes('preeklamsia')) return 'O13';
  if (s.includes('anemia') || s.includes('hb rendah')) return 'D50.9';
  if (s.includes('k1') || s.includes('pertama')) return 'Z34.0';
  return 'Z34.8';
}

async function applySchemaMigrationIfExecute(pool) {
  const sqlFile = path.join(repoRoot, 'database/18_rme_dashboard_schema.sql');
  const content = fs.readFileSync(sqlFile, 'utf8');
  const batches = content
    .split(/^\s*GO\s*$/gim)
    .map((b) => b.trim())
    .filter((b) => b.length > 0);
  for (const batch of batches) {
    await pool.request().batch(batch);
  }
}

async function main() {
  console.log(`=============================================================`);
  console.log(` Backfill Data RME & Konsistensi Tagihan/Stok — Mode: ${modeLabel}`);
  console.log(`=============================================================`);

  const pool = await sql.connect({
    server: process.env.DB_SERVER || process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 1433),
    database: process.env.DB_NAME || 'MiniWorldRS',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: { encrypt: false, trustServerCertificate: true }
  });

  try {
    if (isExecute) {
      await applySchemaMigrationIfExecute(pool);
      console.log('[OK] Migrasi skema idempotent 18_rme_dashboard_schema.sql dipastikan aktif.');
    }

    // Analisis dampak sebelum perubahan
    const missingDiagRes = await pool.request().query(`
      SELECT k.kunjungan_id,
             CONVERT(VARCHAR(10), k.tgl_masuk, 23) AS tgl_masuk,
             pem.asesmen,
             l.nama AS layanan_reservasi,
             trLay.nama AS layanan_tagihan
        FROM dbo.[Kunjungan] k
        LEFT JOIN dbo.[Pemeriksaan] pem ON pem.kunjungan_id = k.kunjungan_id
        LEFT JOIN dbo.[Reservasi] r ON r.reservasi_id = k.reservasi_id
        LEFT JOIN dbo.[Layanan_Medis] l ON l.layanan_id = r.layanan_id
        OUTER APPLY (
          SELECT TOP 1 lm.nama
            FROM dbo.[Tagihan] t
            JOIN dbo.[Tagihan_Rincian] tr ON tr.tagihan_id = t.tagihan_id
            JOIN dbo.[Layanan_Medis] lm ON lm.layanan_id = tr.layanan_id
           WHERE t.kunjungan_id = k.kunjungan_id
        ) trLay
       WHERE k.status <> 'BATAL'
         AND NOT EXISTS (
           SELECT 1 FROM dbo.[Kunjungan_Diagnosa] kd WHERE kd.kunjungan_id = k.kunjungan_id
         )
    `);

    const missingTindakanRes = await pool.request().query(`
      SELECT k.kunjungan_id,
             COALESCE(r.layanan_id, trLay.layanan_id, defLay.layanan_id) AS layanan_id
        FROM dbo.[Kunjungan] k
        LEFT JOIN dbo.[Reservasi] r ON r.reservasi_id = k.reservasi_id
        OUTER APPLY (
          SELECT TOP 1 tr.layanan_id
            FROM dbo.[Tagihan] t
            JOIN dbo.[Tagihan_Rincian] tr ON tr.tagihan_id = t.tagihan_id
           WHERE t.kunjungan_id = k.kunjungan_id AND tr.layanan_id IS NOT NULL
        ) trLay
        OUTER APPLY (
          SELECT TOP 1 lm.layanan_id FROM dbo.[Layanan_Medis] lm WHERE lm.aktif = 1 ORDER BY lm.nama ASC
        ) defLay
       WHERE k.status <> 'BATAL'
         AND NOT EXISTS (
           SELECT 1 FROM dbo.[Tindakan_Kunjungan] tk WHERE tk.kunjungan_id = k.kunjungan_id
         )
    `);

    const missingResepMutasiRes = await pool.request().query(`
      SELECT k.kunjungan_id,
             CONVERT(VARCHAR(10), k.tgl_masuk, 23) AS tgl_masuk,
             tr.obat_id,
             CAST(tr.qty AS INT) AS qty
        FROM dbo.[Kunjungan] k
        JOIN dbo.[Tagihan] t ON t.kunjungan_id = k.kunjungan_id
        JOIN dbo.[Tagihan_Rincian] tr ON tr.tagihan_id = t.tagihan_id
       WHERE k.status <> 'BATAL'
         AND tr.obat_id IS NOT NULL
         AND NOT EXISTS (
           SELECT 1 FROM dbo.[Mutasi_Stok] ms
            WHERE ms.kunjungan_id = k.kunjungan_id AND ms.jenis = 'PAKAI'
         )
    `);

    const orphanTagihanRes = await pool.request().query(`
      SELECT t.tagihan_id,
             t.kunjungan_id,
             t.total_tagihan,
             t.total_dibayar,
             ISNULL(rAgg.sum_rincian, 0) AS sum_rincian,
             ISNULL(rAgg.cnt_rincian, 0) AS cnt_rincian,
             ISNULL(pAgg.sum_bayar, 0) AS sum_bayar
        FROM dbo.[Tagihan] t
        OUTER APPLY (
          SELECT SUM(tr.subtotal) AS sum_rincian, COUNT(tr.rincian_id) AS cnt_rincian
            FROM dbo.[Tagihan_Rincian] tr WHERE tr.tagihan_id = t.tagihan_id
        ) rAgg
        OUTER APPLY (
          SELECT SUM(pb.jumlah) AS sum_bayar
            FROM dbo.[Pembayaran] pb WHERE pb.tagihan_id = t.tagihan_id
        ) pAgg
       WHERE t.total_tagihan <> ISNULL(rAgg.sum_rincian, 0)
          OR t.total_dibayar <> ISNULL(pAgg.sum_bayar, 0)
    `);

    const summary = {
      mode: isExecute ? 'EXECUTE' : 'DRY_RUN',
      kunjungan_tanpa_diagnosa: missingDiagRes.recordset.length,
      kunjungan_tanpa_tindakan: missingTindakanRes.recordset.length,
      rincian_obat_tanpa_mutasi_stok: missingResepMutasiRes.recordset.length,
      tagihan_selisih_rincian: orphanTagihanRes.recordset.length
    };

    console.log('\nRingkasan Dampak Backfill:');
    console.table([summary]);

    if (!isExecute) {
      console.log('[DRY-RUN] Tidak ada data yang diubah. Jalankan dengan --execute untuk menerapkan.');
      return;
    }

    if (
      summary.kunjungan_tanpa_diagnosa === 0 &&
      summary.kunjungan_tanpa_tindakan === 0 &&
      summary.rincian_obat_tanpa_mutasi_stok === 0 &&
      summary.tagihan_selisih_rincian === 0
    ) {
      console.log('[IDEMPOTENT] Seluruh data historis sudah lengkap & sinkron (0 perubahan diperlukan).');
      return;
    }

    const tx = new sql.Transaction(pool);
    await tx.begin();
    try {
      const q = async (text, params = {}) => {
        const req = new sql.Request(tx);
        req.input('__audit_akun', sql.NVarChar(64), null);
        req.input('__audit_user', sql.NVarChar(100), 'system-backfill');
        req.input('__audit_keterangan', sql.NVarChar(200), 'Backfill historis RME Fase 1');
        for (const [k, v] of Object.entries(params)) {
          req.input(k, v);
        }
        return req.query(
          `EXEC sp_set_session_context N'akun_id', @__audit_akun;\n` +
            `EXEC sp_set_session_context N'user_ref', @__audit_user;\n` +
            `EXEC sp_set_session_context N'keterangan', @__audit_keterangan;\n` +
            text
        );
      };

      const stafRes = await q(`SELECT TOP 1 staf_id FROM dbo.[Staf] WHERE aktif = 1 ORDER BY nama ASC`);
      const gudangRes = await q(`SELECT TOP 1 gudang_id FROM dbo.[Gudang] ORDER BY nama ASC`);
      const defLayRes = await q(`SELECT TOP 1 layanan_id FROM dbo.[Layanan_Medis] WHERE aktif = 1 ORDER BY nama ASC`);
      const stafId = stafRes.recordset[0]?.staf_id;
      const gudangId = gudangRes.recordset[0]?.gudang_id;
      const defaultLayananId = defLayRes.recordset[0]?.layanan_id;

      // 1. Backfill Kunjungan_Diagnosa
      for (const row of missingDiagRes.recordset) {
        const kode = inferKodeIcdFromText(
          [row.asesmen, row.layanan_reservasi, row.layanan_tagihan].filter(Boolean).join(' ')
        );
        const diagRow = await q(
          `SELECT TOP 1 diagnosa_id FROM dbo.[Diagnosa] WHERE kode_icd = @kode`,
          { kode }
        );
        let diagId = diagRow.recordset[0]?.diagnosa_id;
        if (!diagId) {
          const zRes = await q(`SELECT TOP 1 diagnosa_id FROM dbo.[Diagnosa] WHERE kode_icd = 'Z34.8'`);
          diagId = zRes.recordset[0]?.diagnosa_id;
        }
        if (diagId) {
          await q(
            `INSERT INTO dbo.[Kunjungan_Diagnosa] (kunjungan_id, diagnosa_id, jenis, keterangan)
             VALUES (@kid, @did, 'UTAMA', N'Backfill historis RME')`,
            { kid: row.kunjungan_id, did: diagId }
          );
        }
      }

      // 2. Backfill Tindakan_Kunjungan
      for (const row of missingTindakanRes.recordset) {
        if (!row.layanan_id || !stafId) continue;
        await q(
          `INSERT INTO dbo.[Tindakan_Kunjungan] (tindakan_id, kunjungan_id, layanan_id, staf_id, qty, waktu)
           VALUES (@tid, @kid, @lid, @sid, 1, SYSDATETIME())`,
          {
            tid: randomUUID().toUpperCase(),
            kid: row.kunjungan_id,
            lid: row.layanan_id,
            sid: stafId
          }
        );
      }

      // 3. Backfill Resep + Pengeluaran_Obat + Mutasi_Stok FEFO untuk rincian obat lama
      const groupedByVisit = new Map();
      for (const r of missingResepMutasiRes.recordset) {
        const list = groupedByVisit.get(r.kunjungan_id) || { tgl_masuk: r.tgl_masuk, items: [] };
        list.items.push({ obat_id: r.obat_id, qty: Math.max(1, Number(r.qty) || 1) });
        groupedByVisit.set(r.kunjungan_id, list);
      }

      for (const [kid, payload] of groupedByVisit.entries()) {
        const resepId = randomUUID().toUpperCase();
        await q(
          `INSERT INTO dbo.[Resep] (resep_id, kunjungan_id, staf_id, tanggal, status, override_alergi, alasan_override)
           VALUES (@rid, @kid, @sid, CAST(@tgl AS DATE), 'DISERAHKAN', 0, NULL)`,
          { rid: resepId, kid, sid: stafId, tgl: payload.tgl_masuk }
        );

        for (const item of payload.items) {
          await q(
            `INSERT INTO dbo.[Resep_Detail] (resep_id, obat_id, jumlah, aturan_pakai)
             VALUES (@rid, @oid, @qty, N'Backfill historis resep')`,
            { rid: resepId, oid: item.obat_id, qty: item.qty }
          );

          let batches = await q(
            `SELECT sb.batch_id, sb.gudang_id, sb.jumlah
               FROM dbo.[Stok_Batch] sb
               INNER JOIN dbo.[Batch_Obat] b ON b.batch_id = sb.batch_id
              WHERE b.obat_id = @oid
                AND b.tgl_kedaluwarsa >= CAST(SYSDATETIME() AS DATE)
                AND sb.jumlah > 0
              ORDER BY b.tgl_kedaluwarsa ASC`,
            { oid: item.obat_id }
          );

          const avail = batches.recordset.reduce((a, b) => a + Number(b.jumlah), 0);
          if (avail < item.qty && gudangId) {
            const topUp = item.qty - avail;
            const adjBatchId = randomUUID().toUpperCase();
            await q(
              `INSERT INTO dbo.[Batch_Obat] (batch_id, obat_id, penerimaan_id, no_batch, tgl_kedaluwarsa, harga_beli, tgl_masuk)
               VALUES (@bid, @oid, NULL, @nb, DATEADD(MONTH, 12, CAST(SYSDATETIME() AS DATE)), 1000, CAST(@tgl AS DATE))`,
              {
                bid: adjBatchId,
                oid: item.obat_id,
                nb: `BF-${adjBatchId.slice(0, 8)}`,
                tgl: payload.tgl_masuk
              }
            );
            await q(
              `INSERT INTO dbo.[Stok_Batch] (batch_id, gudang_id, jumlah) VALUES (@bid, @gid, @qty)`,
              { bid: adjBatchId, gid: gudangId, qty: topUp }
            );
            await q(
              `INSERT INTO dbo.[Mutasi_Stok] (mutasi_id, batch_id, gudang_id, kunjungan_id, staf_id, jenis, jumlah, waktu, keterangan)
               VALUES (@mid, @bid, @gid, NULL, @sid, 'MASUK', @qty, SYSDATETIME(), N'Saldo awal backfill historis')`,
              { mid: randomUUID().toUpperCase(), bid: adjBatchId, gid: gudangId, sid: stafId, qty: topUp }
            );

            batches = await q(
              `SELECT sb.batch_id, sb.gudang_id, sb.jumlah
                 FROM dbo.[Stok_Batch] sb
                 INNER JOIN dbo.[Batch_Obat] b ON b.batch_id = sb.batch_id
                WHERE b.obat_id = @oid
                  AND b.tgl_kedaluwarsa >= CAST(SYSDATETIME() AS DATE)
                  AND sb.jumlah > 0
                ORDER BY b.tgl_kedaluwarsa ASC`,
              { oid: item.obat_id }
            );
          }

          let rem = item.qty;
          for (const b of batches.recordset) {
            if (rem <= 0) break;
            const take = Math.min(rem, Number(b.jumlah));
            await q(
              `UPDATE dbo.[Stok_Batch] SET jumlah = jumlah - @take WHERE batch_id = @bid AND gudang_id = @gid`,
              { take, bid: b.batch_id, gid: b.gudang_id }
            );
            await q(
              `INSERT INTO dbo.[Pengeluaran_Obat] (pengeluaran_id, resep_id, obat_id, batch_id, gudang_id, apoteker_staf_id, jumlah, waktu)
               VALUES (@pid, @rid, @oid, @bid, @gid, @sid, @take, SYSDATETIME())`,
              {
                pid: randomUUID().toUpperCase(),
                rid: resepId,
                oid: item.obat_id,
                bid: b.batch_id,
                gid: b.gudang_id,
                sid: stafId,
                take
              }
            );
            await q(
              `INSERT INTO dbo.[Mutasi_Stok] (mutasi_id, batch_id, gudang_id, kunjungan_id, staf_id, jenis, jumlah, waktu, keterangan)
               VALUES (@mid, @bid, @gid, @kid, @sid, 'PAKAI', @neg, SYSDATETIME(), N'Backfill pemakaian resep RME')`,
              {
                mid: randomUUID().toUpperCase(),
                bid: b.batch_id,
                gid: b.gudang_id,
                kid,
                sid: stafId,
                neg: -take
              }
            );
            rem -= take;
          }
        }
      }

      // 4. Rekonsiliasi Tagihan lama yang belum punya rincian, selisih rincian, atau selisih total_dibayar vs Pembayaran
      for (const t of orphanTagihanRes.recordset) {
        const targetBayar = Number(t.sum_bayar ?? 0);
        if (Number(t.cnt_rincian) === 0 && Math.max(Number(t.total_tagihan), targetBayar) > 0 && defaultLayananId) {
          const nom = Math.max(Number(t.total_tagihan), targetBayar);
          await q(
            `INSERT INTO dbo.[Tagihan_Rincian] (rincian_id, tagihan_id, layanan_id, obat_id, paket_id, qty, harga_satuan, subtotal)
             VALUES (@rid, @tid, @lid, NULL, NULL, 1, @tot, @tot)`,
            {
              rid: randomUUID().toUpperCase(),
              tid: t.tagihan_id,
              lid: defaultLayananId,
              tot: nom
            }
          );
        } else if (Number(t.cnt_rincian) > 0 && Number(t.sum_rincian) < targetBayar && defaultLayananId) {
          const selisih = targetBayar - Number(t.sum_rincian);
          await q(
            `INSERT INTO dbo.[Tagihan_Rincian] (rincian_id, tagihan_id, layanan_id, obat_id, paket_id, qty, harga_satuan, subtotal)
             VALUES (@rid, @tid, @lid, NULL, NULL, 1, @sel, @sel)`,
            {
              rid: randomUUID().toUpperCase(),
              tid: t.tagihan_id,
              lid: defaultLayananId,
              sel: selisih
            }
          );
        }
        await q(
          `DECLARE @s DECIMAL(14,2) = ISNULL((SELECT SUM(subtotal) FROM dbo.[Tagihan_Rincian] WHERE tagihan_id = @tid), 0);
           DECLARE @b DECIMAL(14,2) = ISNULL((SELECT SUM(jumlah) FROM dbo.[Pembayaran] WHERE tagihan_id = @tid), 0);
           UPDATE dbo.[Tagihan]
              SET total_tagihan = @s,
                  total_dibayar = @b,
                  status = CASE WHEN @b >= @s AND @s > 0 THEN 'LUNAS' ELSE 'BELUM_LUNAS' END
            WHERE tagihan_id = @tid`,
          { tid: t.tagihan_id }
        );
      }

      // 5. Sinkronkan Obat.stok_saat_ini = stok aktif belum kedaluwarsa
      await q(`
        UPDATE o
           SET o.stok_saat_ini = ISNULL(agg.stok_aktif, 0)
          FROM dbo.[Obat] o
          OUTER APPLY (
            SELECT CAST(ISNULL(SUM(sb.jumlah), 0) AS INT) AS stok_aktif
              FROM dbo.[Batch_Obat] b
              INNER JOIN dbo.[Stok_Batch] sb ON sb.batch_id = b.batch_id
             WHERE b.obat_id = o.obat_id
               AND b.tgl_kedaluwarsa >= CAST(SYSDATETIME() AS DATE)
          ) agg
      `);

      await tx.commit();
      console.log('\n[SUKSES] Backfill dieksekusi secara atomik dan seluruh data historis telah sinkron.');
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  } finally {
    await pool.close();
  }
}

main().catch((err) => {
  console.error('[ERROR BACKFILL]', err);
  process.exit(1);
});
