#!/usr/bin/env node
/**
 * scripts/seed_dashboard_demo.cjs
 * Seed Data Demo Deterministik & Idempotent untuk Dashboard, Laporan Operasional,
 * Analisis Efek Harga, dan Rekap Pendapatan (Sistem Digitalisasi PMB).
 *
 * Perintah:
 *   node scripts/seed_dashboard_demo.cjs          # Pasang / perbarui ulang seed demo (idempotent)
 *   node scripts/seed_dashboard_demo.cjs --clean  # Bersihkan hanya data demo tanpa menyentuh data asli
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert');

const repoRoot = path.resolve(__dirname, '..');
require(path.join(repoRoot, 'node_modules/dotenv')).config({
  path: path.join(repoRoot, '.env')
});
require(path.join(repoRoot, 'node_modules/dotenv')).config({
  path: path.join(repoRoot, 'apps/backend/.env')
});
const sql = require(path.join(repoRoot, 'node_modules/mssql'));

const isCleanOnly = process.argv.includes('--clean');
const FIXED_SEED = 20261128;

// PRNG Deterministik (Mulberry32)
function createRng(seed) {
  let a = seed >>> 0;
  return function next() {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// UUID Deterministik berawalan DD000000-... sebagai penanda eksklusif data demo
function demoUuid(categoryCode, index) {
  const catHex = (categoryCode & 0xffff).toString(16).padStart(4, '0').toUpperCase();
  const idxHex = (index >>> 0).toString(16).padStart(12, '0').toUpperCase();
  return `DD000000-${catHex}-4000-8000-${idxHex}`;
}

function addDaysIso(baseIso, deltaDays) {
  const [y, m, d] = baseIso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays));
  return dt.toISOString().slice(0, 10);
}

function addMonthsIso(baseIso, deltaMonths) {
  const [y, m, d] = baseIso.split('-').map(Number);
  const targetMonthIndex = m - 1 + deltaMonths;
  const ty = y + Math.floor(targetMonthIndex / 12);
  const tm = ((targetMonthIndex % 12) + 12) % 12;
  const maxDay = new Date(Date.UTC(ty, tm + 1, 0)).getUTCDate();
  const td = Math.min(d, maxDay);
  return new Date(Date.UTC(ty, tm, td)).toISOString().slice(0, 10);
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function pickWeighted(rng, weightedItems) {
  const total = weightedItems.reduce((acc, it) => acc + it.weight, 0);
  let r = rng() * total;
  for (const it of weightedItems) {
    r -= it.weight;
    if (r <= 0) return it.item;
  }
  return weightedItems[weightedItems.length - 1].item;
}

async function execBatchedValues(reqFactory, prefixSql, valueRows, chunkSize = 150) {
  for (let i = 0; i < valueRows.length; i += chunkSize) {
    const chunk = valueRows.slice(i, i + chunkSize);
    await reqFactory().query(`${prefixSql}\nVALUES\n${chunk.join(',\n')};`);
  }
}

async function cleanDemoData(reqFactory) {
  await reqFactory().query(`
    DELETE pb FROM dbo.[Pembayaran] pb
     WHERE pb.pembayaran_id LIKE 'DD000000-%'
        OR pb.tagihan_id LIKE 'DD000000-%';

    DELETE kp FROM dbo.[Klaim_Penjamin] kp
     WHERE kp.tagihan_id LIKE 'DD000000-%';

    DELETE tr FROM dbo.[Tagihan_Rincian] tr
     WHERE tr.rincian_id LIKE 'DD000000-%'
        OR tr.tagihan_id LIKE 'DD000000-%';

    DELETE t FROM dbo.[Tagihan] t
     WHERE t.tagihan_id LIKE 'DD000000-%'
        OR t.kunjungan_id LIKE 'DD000000-%';

    DELETE po FROM dbo.[Pengeluaran_Obat] po
     WHERE po.pengeluaran_id LIKE 'DD000000-%'
        OR po.resep_id LIKE 'DD000000-%'
        OR po.batch_id LIKE 'DD000000-%';

    DELETE rd FROM dbo.[Resep_Detail] rd
     WHERE rd.resep_id LIKE 'DD000000-%'
        OR rd.obat_id LIKE 'DD000000-%';

    DELETE r FROM dbo.[Resep] r
     WHERE r.resep_id LIKE 'DD000000-%'
        OR r.kunjungan_id LIKE 'DD000000-%';

    DELETE ms FROM dbo.[Mutasi_Stok] ms
     WHERE ms.mutasi_id LIKE 'DD000000-%'
        OR ms.batch_id LIKE 'DD000000-%'
        OR ms.kunjungan_id LIKE 'DD000000-%';

    DELETE tk FROM dbo.[Tindakan_Kunjungan] tk
     WHERE tk.tindakan_id LIKE 'DD000000-%'
        OR tk.kunjungan_id LIKE 'DD000000-%';

    DELETE kd FROM dbo.[Kunjungan_Diagnosa] kd
     WHERE kd.kunjungan_id LIKE 'DD000000-%';

    DELETE dm FROM dbo.[Dokumen_Medis] dm
     WHERE dm.dokumen_id LIKE 'DD000000-%'
        OR dm.kunjungan_id LIKE 'DD000000-%';

    DELETE tv FROM dbo.[Tanda_Vital] tv
     WHERE tv.vital_id LIKE 'DD000000-%'
        OR tv.pemeriksaan_id LIKE 'DD000000-%';

    DELETE pem FROM dbo.[Pemeriksaan] pem
     WHERE pem.pemeriksaan_id LIKE 'DD000000-%'
        OR pem.kunjungan_id LIKE 'DD000000-%';

    UPDATE dbo.[Kunjungan]
       SET koreksi_dari_id = NULL
     WHERE kunjungan_id LIKE 'DD000000-%';

    DELETE FROM dbo.[Kunjungan] WHERE kunjungan_id LIKE 'DD000000-%';
    DELETE FROM dbo.[Reservasi] WHERE reservasi_id LIKE 'DD000000-%';
    DELETE FROM dbo.[Jadwal_Praktik] WHERE jadwal_id LIKE 'DD000000-%';
    DELETE FROM dbo.[Alergi_Kondisi] WHERE alergi_id LIKE 'DD000000-%';

    DELETE sb FROM dbo.[Stok_Batch] sb
     WHERE sb.batch_id LIKE 'DD000000-%';

    DELETE bo FROM dbo.[Batch_Obat] bo
     WHERE bo.batch_id LIKE 'DD000000-%' OR bo.no_batch LIKE 'DMBATCH-%';

    DELETE ho FROM dbo.[Harga_Obat] ho
     WHERE ho.harga_obat_id LIKE 'DD000000-%' OR ho.obat_id LIKE 'DD000000-%';

    DELETE FROM dbo.[Obat]
     WHERE obat_id LIKE 'DD000000-%' OR kode LIKE 'DMOBT-%';

    DELETE hl FROM dbo.[Harga_Layanan] hl
     WHERE hl.harga_layanan_id LIKE 'DD000000-%' OR hl.layanan_id LIKE 'DD000000-%';

    DELETE FROM dbo.[Layanan_Medis]
     WHERE layanan_id LIKE 'DD000000-%' OR kode LIKE 'DMLAY-%';

    DELETE FROM dbo.[Pasien]
     WHERE pasien_id LIKE 'DD000000-%' OR no_rm LIKE 'DM%';
  `);
}

async function main() {
  const pool = await sql.connect({
    server: process.env.DB_SERVER || process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 1433),
    database: process.env.DB_NAME || 'MiniWorldRS',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    requestTimeout: 120000,
    options: { encrypt: false, trustServerCertificate: true }
  });

  try {
    // Pastikan migrasi skema 18 terpasang
    const migPath = path.join(repoRoot, 'database/18_rme_dashboard_schema.sql');
    const migSql = fs.readFileSync(migPath, 'utf8');
    for (const batch of migSql.split(/^\s*GO\s*$/gim).map((s) => s.trim()).filter(Boolean)) {
      await pool.request().batch(batch);
    }

    const todayRow = await pool.request().query(`
      SELECT CONVERT(VARCHAR(10), CAST(SYSDATETIME() AS DATE), 23) AS today_iso,
             CONVERT(VARCHAR(10), DATEADD(MONTH, 3, CAST(SYSDATETIME() AS DATE)), 23) AS plus3m_iso
    `);
    const todayIso = todayRow.recordset[0].today_iso;
    const exact3MonthsIso = todayRow.recordset[0].plus3m_iso;

    // Ambil referensi master non-demo yang sudah ada di DB
    const unitId = (await pool.request().query(`SELECT TOP 1 unit_id FROM dbo.[Unit_Pelayanan] WHERE aktif = 1`)).recordset[0].unit_id;
    const stafRows = (await pool.request().query(`SELECT staf_id, nama FROM dbo.[Staf] WHERE aktif = 1 ORDER BY nama ASC`)).recordset;
    const stafUtamaId = stafRows[0].staf_id;
    const stafKasirId = (stafRows[1] || stafRows[0]).staf_id;
    const akunRow = (await pool.request().query(`SELECT TOP 1 akun_id FROM dbo.[Akun_Pengguna] ORDER BY username ASC`)).recordset[0];
    const akunPembuatSql = akunRow ? `'${akunRow.akun_id}'` : 'NULL';
    let ruanganRow = (await pool.request().query(`SELECT TOP 1 ruangan_id FROM dbo.[Ruangan]`)).recordset[0];
    if (!ruanganRow) {
      const gedungRow = (await pool.request().query(`SELECT TOP 1 gedung_id FROM dbo.[Gedung]`)).recordset[0];
      const newRuangId = demoUuid(0x0001, 1);
      await pool.request().query(`
        INSERT INTO dbo.[Ruangan] (ruangan_id, unit_id, gedung_id, kode, nama, jenis, lantai, kapasitas, status)
        VALUES ('${newRuangId}', '${unitId}', ${gedungRow ? `'${gedungRow.gedung_id}'` : 'NULL'}, 'R-PMB-1', N'Ruang Periksa Kebidanan 1', 'RAWAT_JALAN', 1, 2, 'TERSEDIA')
      `);
      ruanganRow = { ruangan_id: newRuangId };
    }
    const ruanganId = ruanganRow.ruangan_id;
    const gudangId = (await pool.request().query(`SELECT TOP 1 gudang_id FROM dbo.[Gudang] ORDER BY nama ASC`)).recordset[0].gudang_id;

    // Pastikan ketiga jenis Penjamin (MANDIRI, BPJS, ASURANSI) tersedia
    const penjaminRows = (await pool.request().query(`SELECT penjamin_id, jenis, nama FROM dbo.[Penjamin] WHERE aktif = 1`)).recordset;
    const penjaminByJenis = {};
    for (const p of penjaminRows) {
      if (!penjaminByJenis[p.jenis]) penjaminByJenis[p.jenis] = p.penjamin_id;
    }
    for (const needed of [
      { jenis: 'MANDIRI', nama: 'Pasien Umum / Mandiri', id: demoUuid(0x0002, 1) },
      { jenis: 'BPJS', nama: 'BPJS Kesehatan', id: demoUuid(0x0002, 2) },
      { jenis: 'ASURANSI', nama: 'Asuransi Kesehatan Mitra', id: demoUuid(0x0002, 3) }
    ]) {
      if (!penjaminByJenis[needed.jenis]) {
        await pool.request().query(`
          INSERT INTO dbo.[Penjamin] (penjamin_id, nama, jenis, aktif)
          VALUES ('${needed.id}', N'${needed.nama}', '${needed.jenis}', 1)
        `);
        penjaminByJenis[needed.jenis] = needed.id;
      }
    }

    // Ambil 15 diagnosis standar dari dbo.[Diagnosa]
    const diagRows = (
      await pool.request().query(`
        SELECT diagnosa_id, kode_icd, nama
          FROM dbo.[Diagnosa]
         WHERE kode_icd IN ('Z34.8','Z30.4','Z00.1','Z34.0','Z39.2','Z23','Z39.1','D50.9','O21.0','Z30.0','Z30.5','O80','O13','N76.0','P07.3')
      `)
    ).recordset;
    const diagByKode = Object.fromEntries(diagRows.map((d) => [d.kode_icd, d]));

    const tx = new sql.Transaction(pool);
    await tx.begin();

    const makeReq = () => {
      const r = new sql.Request(tx);
      const origQuery = r.query.bind(r);
      r.query = (qText) =>
        origQuery(
          `EXEC sp_set_session_context N'akun_id', NULL;\n` +
            `EXEC sp_set_session_context N'user_ref', N'seed-demo-deterministic';\n` +
            `EXEC sp_set_session_context N'keterangan', N'[DEMO-DASH] Seed deterministik Fase 2';\n` +
            qText
        );
      return r;
    };

    try {
      await cleanDemoData(makeReq);

      if (isCleanOnly) {
        await tx.commit();
        console.log('[CLEAN] Seluruh data demo [DEMO-DASH] berhasil dibersihkan. Data non-demo tetap utuh.');
        return;
      }

      const rng = createRng(FIXED_SEED);

      // Rentang 105 hari ke belakang s/d hari ini (>= 90 hari!)
      const startIso = addDaysIso(todayIso, -104);
      // Titik perubahan harga tengah periode: 18 hari sebelum hari ini (di dalam bulan berjalan!)
      const midPriceChangeIso = addDaysIso(todayIso, -18);
      const prevDayBeforeChangeIso = addDaysIso(midPriceChangeIso, -1);
      const futurePriceIso = addDaysIso(todayIso, 40);

      // 1. Buat 80 Pasien Demo (berpenanda DM0001..DM0080 & [DEMO-DASH])
      const namaDepan = [
        'Ayu', 'Siti', 'Dewi', 'Rina', 'Putri', 'Nadia', 'Fitri', 'Lestari', 'Ratna', 'Wulan',
        'Kartika', 'Mega', 'Indah', 'Sri', 'intan', 'Yuni', 'Novi', 'Dian', 'Anisa', 'Rahma'
      ];
      const namaBelakang = [
        'Pratiwi', 'Handayani', 'Kusuma', 'Lestari', 'Safitri', 'Permata', 'Wulandari', 'Oktaviani',
        'Anggraini', 'ramadhani', 'Sari', 'Utami', 'Ningrum', 'Hidayah', 'amelia'
      ];
      const pasienIds = [];
      const pasienValues = [];
      for (let i = 1; i <= 80; i++) {
        const pid = demoUuid(0x0100, i);
        pasienIds.push(pid);
        const noRm = `DM${String(i).padStart(4, '0')}`;
        const nik = `157199${String(i).padStart(10, '0')}`;
        const nd = namaDepan[(i - 1) % namaDepan.length];
        const nb = namaBelakang[((i - 1) * 3) % namaBelakang.length];
        const nama = `Ny. ${nd.charAt(0).toUpperCase() + nd.slice(1)} ${nb.charAt(0).toUpperCase() + nb.slice(1)}`;
        const thn = 1988 + (i % 16);
        const bln = pad2((i % 12) + 1);
        const hri = pad2((i % 27) + 1);
        const gol = ['O', 'A', 'B', 'AB'][i % 4];
        const telp = `081399${String(i).padStart(6, '0')}`;
        pasienValues.push(
          `('${pid}', '${noRm}', '${nik}', N'${nama}', 'P', '${thn}-${bln}-${hri}', N'Jambi', N'Jl. Demo Kebidanan No. ${i} [DEMO-DASH]', '${telp}', '${gol}', 'MENIKAH', N'Ibu Rumah Tangga', 'demo.pasien${i}@pmb.local', SYSDATETIME())`
        );
      }
      await execBatchedValues(
        makeReq,
        `INSERT INTO dbo.[Pasien] (pasien_id, no_rm, nik, nama, jenis_kelamin, tgl_lahir, tempat_lahir, alamat, no_telepon, gol_darah, status_pernikahan, pekerjaan, email, created_at)`,
        pasienValues
      );

      // Tambahkan 2 Alergi_Kondisi aktif pada pasien demo #1 & #2 untuk uji Red-Flag RME
      await makeReq().query(`
        INSERT INTO dbo.[Alergi_Kondisi] (alergi_id, pasien_id, obat_id, dicatat_oleh, kategori, nama, keterangan, aktif, created_at)
        VALUES
          ('${demoUuid(0x0150, 1)}', '${pasienIds[0]}', NULL, '${stafUtamaId}', 'ALERGI_OBAT', N'Amoksisilin / Golongan Penisilin', N'Ruam urtikaria [DEMO-DASH]', 1, SYSDATETIME()),
          ('${demoUuid(0x0150, 2)}', '${pasienIds[1]}', NULL, '${stafUtamaId}', 'KEHAMILAN_RISTI', N'Riwayat Preeklamsia Ringan', N'Pantau TD tiap kunjungan [DEMO-DASH]', 1, SYSDATETIME());
      `);

      // 2. Buat 8 Layanan Medis Demo (termasuk perubahan harga tengah periode & layanan khusus periode terbaru!)
      const layananDefs = [
        { idx: 1, kode: 'DMLAY-01', nama: 'Pemeriksaan Kehamilan ANC Terpadu', kat: 'ANC', icd9: '89.26', hrgLama: 75000, hrgBaru: 90000, hrgMasaDepan: 115000, weight: 28, newOnly: false },
        { idx: 2, kode: 'DMLAY-02', nama: 'Pelayanan KB Suntik 3 Bulan', kat: 'KB', icd9: '99.23', hrgLama: 45000, hrgBaru: 55000, hrgMasaDepan: null, weight: 20, newOnly: false },
        { idx: 3, kode: 'DMLAY-03', nama: 'Pemeriksaan Bayi & Tumbuh Kembang', kat: 'BAYI', icd9: '89.70', hrgLama: 60000, hrgBaru: 60000, hrgMasaDepan: null, weight: 15, newOnly: false },
        { idx: 4, kode: 'DMLAY-04', nama: 'Kontrol Nifas & Laktasi Ibu', kat: 'NIFAS', icd9: '89.03', hrgLama: 65000, hrgBaru: 70000, hrgMasaDepan: null, weight: 14, newOnly: false },
        { idx: 5, kode: 'DMLAY-05', nama: 'Imunisasi Dasar Bayi', kat: 'IMUNISASI', icd9: '99.55', hrgLama: 80000, hrgBaru: 80000, hrgMasaDepan: null, weight: 10, newOnly: false },
        { idx: 6, kode: 'DMLAY-06', nama: 'Pemasangan / Kontrol KB IUD & Implan', kat: 'KB', icd9: '69.70', hrgLama: 220000, hrgBaru: 250000, hrgMasaDepan: null, weight: 6, newOnly: false },
        { idx: 7, kode: 'DMLAY-07', nama: 'Pertolongan Persalinan Normal 24 Jam', kat: 'PERSALINAN', icd9: '73.59', hrgLama: 1200000, hrgBaru: 1200000, hrgMasaDepan: null, weight: 3, newOnly: false },
        // Layanan ke-8 HANYA dipakai di periode terbaru untuk menguji "item baru di periode pembanding" (qty_lama = 0)!
        { idx: 8, kode: 'DMLAY-08', nama: 'Kelas Edukasi & Senam Hamil Intensif', kat: 'ANC', icd9: '93.39', hrgLama: 50000, hrgBaru: 50000, hrgMasaDepan: null, weight: 4, newOnly: true }
      ];

      const layananValues = [];
      const hargaLayananValues = [];
      for (const l of layananDefs) {
        l.id = demoUuid(0x0200, l.idx);
        layananValues.push(
          `('${l.id}', '${unitId}', '${l.kode}', N'${l.nama}', '${l.kat}', 'TINDAKAN', '${l.icd9}', 1)`
        );
        if (l.hrgLama !== l.hrgBaru) {
          hargaLayananValues.push(
            `('${demoUuid(0x0210, l.idx * 10 + 1)}', '${l.id}', NULL, NULL, '${stafUtamaId}', ${l.hrgLama}, '${addDaysIso(startIso, -30)}', '${prevDayBeforeChangeIso}', N'Tarif awal periode [DEMO-DASH]')`,
            `('${demoUuid(0x0210, l.idx * 10 + 2)}', '${l.id}', NULL, NULL, '${stafUtamaId}', ${l.hrgBaru}, '${midPriceChangeIso}', ${l.hrgMasaDepan ? `'${addDaysIso(futurePriceIso, -1)}'` : 'NULL'}, N'Penyesuaian tarif tengah periode [DEMO-DASH]')`
          );
          if (l.hrgMasaDepan) {
            hargaLayananValues.push(
              `('${demoUuid(0x0210, l.idx * 10 + 3)}', '${l.id}', NULL, NULL, '${stafUtamaId}', ${l.hrgMasaDepan}, '${futurePriceIso}', NULL, N'Tarif terjadwal masa depan [DEMO-DASH]')`
            );
          }
        } else {
          hargaLayananValues.push(
            `('${demoUuid(0x0210, l.idx * 10 + 1)}', '${l.id}', NULL, NULL, '${stafUtamaId}', ${l.hrgLama}, '${addDaysIso(startIso, -30)}', NULL, N'Tarif standar [DEMO-DASH]')`
          );
        }
      }
      await execBatchedValues(
        makeReq,
        `INSERT INTO dbo.[Layanan_Medis] (layanan_id, unit_id, kode, nama, kategori, satuan, kode_icd9, aktif)`,
        layananValues
      );
      await execBatchedValues(
        makeReq,
        `INSERT INTO dbo.[Harga_Layanan] (harga_layanan_id, layanan_id, kelas_id, penjamin_id, diubah_oleh, harga, berlaku_dari, berlaku_sampai, alasan)`,
        hargaLayananValues
      );

      // 3. Buat 22 Obat / Produk Kesehatan Demo (>= 20 item!) mencakup seluruh 4 status & batas tepi
      const obatDefs = [
        // 1..8: Obat yang rutin diresepkan di RME (stok awal dibuat besar supaya setelah dipotong ~500 resep tetap AMAN!)
        { idx: 1, kode: 'DMOBT-01', gen: 'Asam Folat 400 mcg', dag: 'Folavit Demo', kat: 'OBAT', gol: 'SUPLEMEN', btk: 'TABLET', sat: 'STRIP', min: 25, hrgLama: 12000, hrgBaru: 15000, hrgFuture: 25000, prescribed: true, targetEndStock: 140, expMode: 'SAFE' },
        { idx: 2, kode: 'DMOBT-02', gen: 'Ferrous Sulfate + Folic Acid', dag: 'Sangobion Demo', kat: 'OBAT', gol: 'SUPLEMEN', btk: 'KAPSUL', sat: 'STRIP', min: 25, hrgLama: 18000, hrgBaru: 22000, hrgFuture: null, prescribed: true, targetEndStock: 120, expMode: 'SAFE' },
        { idx: 3, kode: 'DMOBT-03', gen: 'Kalsium Laktat 500 mg', dag: 'Kalk Ibu Hamil Demo', kat: 'OBAT', gol: 'SUPLEMEN', btk: 'TABLET', sat: 'STRIP', min: 20, hrgLama: 10000, hrgBaru: 10000, hrgFuture: null, prescribed: true, targetEndStock: 95, expMode: 'SAFE' },
        { idx: 4, kode: 'DMOBT-04', gen: 'Parasetamol 500 mg', dag: 'Pamol Kebidanan Demo', kat: 'OBAT', gol: 'BEBAS', btk: 'TABLET', sat: 'STRIP', min: 30, hrgLama: 8000, hrgBaru: 9500, hrgFuture: null, prescribed: true, targetEndStock: 110, expMode: 'SAFE' },
        { idx: 5, kode: 'DMOBT-05', gen: 'Medroxyprogesterone Acetate 150 mg', dag: 'Depo Progestin Demo', kat: 'OBAT', gol: 'KERAS', btk: 'VIAL', sat: 'VIAL', min: 15, hrgLama: 25000, hrgBaru: 28000, hrgFuture: null, prescribed: true, targetEndStock: 85, expMode: 'SAFE' },
        { idx: 6, kode: 'DMOBT-06', gen: 'Vitamin B6 Pyridoxine 10 mg', dag: 'B6 Antiemetik Demo', kat: 'OBAT', gol: 'BEBAS', btk: 'TABLET', sat: 'STRIP', min: 20, hrgLama: 7500, hrgBaru: 7500, hrgFuture: null, prescribed: true, targetEndStock: 75, expMode: 'SAFE' },
        { idx: 7, kode: 'DMOBT-07', gen: 'Ekstrak Daun Katuk Pelancar ASI', dag: 'Asifit Demo', kat: 'OBAT', gol: 'SUPLEMEN', btk: 'KAPLET', sat: 'STRIP', min: 15, hrgLama: 24000, hrgBaru: 27000, hrgFuture: null, prescribed: true, targetEndStock: 60, expMode: 'SAFE' },
        { idx: 8, kode: 'DMOBT-08', gen: 'Parasetamol Drops Bayi 60 mg', dag: 'Tempra Drops Demo', kat: 'OBAT', gol: 'BEBAS', btk: 'DROP', sat: 'BOTOL', min: 10, hrgLama: 32000, hrgBaru: 32000, hrgFuture: null, prescribed: true, targetEndStock: 48, expMode: 'SAFE' },

        // 9..12: Item AMAN tambahan
        { idx: 9, kode: 'DMOBT-09', gen: 'Vitamin K1 Phytomenadione Injeksi', dag: 'Neo-K Demo', kat: 'OBAT', gol: 'KERAS', btk: 'AMPUL', sat: 'AMPUL', min: 10, hrgLama: 18000, hrgBaru: 18000, hrgFuture: null, prescribed: false, targetEndStock: 35, expMode: 'SAFE' },
        { idx: 10, kode: 'DMOBT-10', gen: 'Salep Mata Gentamisin 0.3%', dag: 'Genoint BBL Demo', kat: 'OBAT', gol: 'KERAS', btk: 'SALEP', sat: 'TUBE', min: 8, hrgLama: 14000, hrgBaru: 14000, hrgFuture: null, prescribed: false, targetEndStock: 28, expMode: 'SAFE' },
        { idx: 11, kode: 'DMOBT-11', gen: 'Spuit Disposible Steril 3 mL', dag: 'OneMed Spuit 3cc Demo', kat: 'ALKES', gol: 'ALKES', btk: 'PCS', sat: 'PCS', min: 50, hrgLama: 3500, hrgBaru: 3500, hrgFuture: null, prescribed: false, targetEndStock: 180, expMode: 'SAFE' },
        { idx: 12, kode: 'DMOBT-12', gen: 'Sarung Tangan Pemeriksaan Nitrile', dag: 'Sensi Gloves Demo', kat: 'ALKES', gol: 'ALKES', btk: 'BOX', sat: 'BOX', min: 5, hrgLama: 65000, hrgBaru: 65000, hrgFuture: null, prescribed: false, targetEndStock: 20, expMode: 'SAFE' },

        // 13: KASUS TEPI: stok_aktif TEPAT SAMA DENGAN stok_minimum (15 === 15 -> wajib AMAN!)
        { idx: 13, kode: 'DMOBT-13', gen: 'Kasa Steril Hidrofil 16x16', dag: 'Kasa Husada Demo', kat: 'ALKES', gol: 'ALKES', btk: 'BOX', sat: 'BOX', min: 15, hrgLama: 12000, hrgBaru: 12000, hrgFuture: null, prescribed: false, targetEndStock: 15, expMode: 'SAFE' },

        // 14..17: MENIPIS (0 < stok_aktif < stok_minimum)
        { idx: 14, kode: 'DMOBT-14', gen: 'Oksitosin Injeksi 10 IU/mL', dag: 'Syntocinon Demo', kat: 'OBAT', gol: 'KERAS', btk: 'AMPUL', sat: 'AMPUL', min: 20, hrgLama: 22000, hrgBaru: 22000, hrgFuture: null, prescribed: false, targetEndStock: 6, expMode: 'SAFE' },
        { idx: 15, kode: 'DMOBT-15', gen: 'Methylergometrine Maleate Injeksi', dag: 'Methergin Demo', kat: 'OBAT', gol: 'KERAS', btk: 'AMPUL', sat: 'AMPUL', min: 15, hrgLama: 25000, hrgBaru: 25000, hrgFuture: null, prescribed: false, targetEndStock: 4, expMode: 'SAFE' },
        { idx: 16, kode: 'DMOBT-16', gen: 'Cairan Infus Ringer Laktat 500 mL', dag: 'Otsuka RL Demo', kat: 'OBAT', gol: 'KERAS', btk: 'FLABOT', sat: 'FLABOT', min: 12, hrgLama: 16000, hrgBaru: 16000, hrgFuture: null, prescribed: false, targetEndStock: 5, expMode: 'SAFE' },
        { idx: 17, kode: 'DMOBT-17', gen: 'Benang Jahit Catgut Chromic 2/0', dag: 'Catgut Perineum Demo', kat: 'ALKES', gol: 'ALKES', btk: 'PCS', sat: 'PCS', min: 10, hrgLama: 38000, hrgBaru: 38000, hrgFuture: null, prescribed: false, targetEndStock: 3, expMode: 'SAFE' },

        // 18: KASUS TEPI: stok = 0 (stok_aktif = 0 < stok_minimum = 10 -> MENIPIS)
        { idx: 18, kode: 'DMOBT-18', gen: 'Magnesium Sulfat MgSO4 40%', dag: 'MgSO4 Otsuka Demo', kat: 'OBAT', gol: 'KERAS', btk: 'FLACON', sat: 'FLACON', min: 10, hrgLama: 28000, hrgBaru: 28000, hrgFuture: null, prescribed: false, targetEndStock: 0, expMode: 'ZERO' },

        // 19: MENDEKATI_KEDALUWARSA (+35 hari dari hari ini)
        { idx: 19, kode: 'DMOBT-19', gen: 'Pil KB Kombinasi Levonorgestrel', dag: 'Andalan Pil KB Demo', kat: 'OBAT', gol: 'KERAS', btk: 'BLISTER', sat: 'BLISTER', min: 10, hrgLama: 15000, hrgBaru: 15000, hrgFuture: null, prescribed: false, targetEndStock: 24, expMode: 'NEAR_35D' },

        // 20: KASUS TEPI: MENDEKATI_KEDALUWARSA TEPAT di batas 3 bulan (DATEADD(MONTH, 3, hari_ini))!
        { idx: 20, kode: 'DMOBT-20', gen: 'Nifedipine 10 mg Antihipertensi', dag: 'Adalat Oros Demo', kat: 'OBAT', gol: 'KERAS', btk: 'TABLET', sat: 'STRIP', min: 10, hrgLama: 21000, hrgBaru: 21000, hrgFuture: null, prescribed: false, targetEndStock: 18, expMode: 'EXACT_3M' },

        // 21: KEDALUWARSA (punya batch kedaluwarsa -20 hari qty=9 + batch aman +240 hari qty=30)
        { idx: 21, kode: 'DMOBT-21', gen: 'Povidone Iodine Antiseptik 10%', dag: 'Betadine Kebidanan Demo', kat: 'ALKES', gol: 'ALKES', btk: 'BOTOL', sat: 'BOTOL', min: 10, hrgLama: 26000, hrgBaru: 26000, hrgFuture: null, prescribed: false, targetEndStock: 30, expMode: 'EXPIRED_PLUS_SAFE' },

        // 22: KEDALUWARSA murni (hanya punya batch kedaluwarsa -10 hari qty=7 -> stok_aktif = 0 -> sekaligus MENIPIS!)
        { idx: 22, kode: 'DMOBT-22', gen: ' Lidokain HCl 2% Injeksi Lokal', dag: 'Lidocain Injeksi Demo', kat: 'OBAT', gol: 'KERAS', btk: 'AMPUL', sat: 'AMPUL', min: 10, hrgLama: 9000, hrgBaru: 9000, hrgFuture: null, prescribed: false, targetEndStock: 0, expMode: 'EXPIRED_ONLY' }
      ];

      for (const o of obatDefs) {
        o.id = demoUuid(0x0300, o.idx);
        o.gen = o.gen.trim();
        o.usedQty = 0;
      }

      // 4. Rencanakan 650 Kunjungan Utama + 15 Koreksi + 25 Reservasi DIBATALKAN secara deterministik di memori dulu
      //    agar stok awal = targetEndStock + totalUsedQty (100% bebas negatif & tepat sesuai target status stok!)
      const diagWeights = [
        { item: 'Z34.8', weight: 24 },
        { item: 'Z30.4', weight: 16 },
        { item: 'Z00.1', weight: 12 },
        { item: 'Z34.0', weight: 10 },
        { item: 'Z39.2', weight: 8 },
        { item: 'Z23', weight: 7 },
        { item: 'Z39.1', weight: 5 },
        { item: 'D50.9', weight: 4.5 },
        { item: 'O21.0', weight: 3.5 },
        { item: 'Z30.0', weight: 3 },
        { item: 'Z30.5', weight: 2.5 },
        { item: 'O80', weight: 2 },
        { item: 'O13', weight: 1.2 },
        { item: 'N76.0', weight: 0.8 },
        { item: 'P07.3', weight: 0.5 }
      ];

      // Distribusi jam dengan puncak jelas di pukul 09:00 WIB (pagi) dan 17:00 WIB (sore)
      const hourWeights = [
        { item: 7, weight: 3 },
        { item: 8, weight: 14 },
        { item: 9, weight: 22 }, // PUNCAK UTAMA PAGI
        { item: 10, weight: 15 },
        { item: 11, weight: 8 },
        { item: 12, weight: 2 },
        { item: 13, weight: 2 },
        { item: 14, weight: 2 },
        { item: 15, weight: 4 },
        { item: 16, weight: 11 },
        { item: 17, weight: 16 }, // PUNCAK KEDUA SORE
        { item: 18, weight: 9 },
        { item: 19, weight: 5 },
        { item: 20, weight: 2 }
      ];

      const prescribedPool = obatDefs.filter((o) => o.prescribed);

      function getEffectiveLayananPrice(lay, dateIso) {
        return dateIso >= midPriceChangeIso ? lay.hrgBaru : lay.hrgLama;
      }
      function getEffectiveObatPrice(obt, dateIso) {
        return dateIso >= midPriceChangeIso ? obt.hrgBaru : obt.hrgLama;
      }

      // Sebarkan 650 kunjungan utama di sepanjang 105 hari (startIso..todayIso), pastikan hari ini punya tepat 8 kunjungan!
      const plannedVisits = [];
      for (let vIdx = 1; vIdx <= 650; vIdx++) {
        let dateIso;
        if (vIdx > 642) {
          // 8 kunjungan hari ini untuk Kartu Kunjungan Hari Ini di Dashboard Internal!
          dateIso = todayIso;
        } else {
          // Sedikit tren naik di 35 hari terakhir supaya perbandingan periode punya efek volume positif & negatif yang kaya
          const dayOffset =
            vIdx <= 300
              ? Math.floor(rng() * 60) // hari 0..59
              : 60 + Math.floor(rng() * 44); // hari 60..103
          dateIso = addDaysIso(startIso, dayOffset);
        }

        // Kasus tepi eksplisit jam 00:00:00 WIB dan 23:59:00 WIB!
        let hh, mm, ss;
        if (vIdx === 643) {
          hh = 0;
          mm = 0;
          ss = 0;
        } else if (vIdx === 642) {
          hh = 23;
          mm = 59;
          ss = 0;
        } else {
          hh = pickWeighted(rng, hourWeights);
          mm = Math.floor(rng() * 60);
          ss = Math.floor(rng() * 60);
        }
        const dtWib = `${dateIso} ${pad2(hh)}:${pad2(mm)}:${pad2(ss)}`;

        const pasienId = pasienIds[(vIdx - 1) % pasienIds.length];
        const availLayanan = layananDefs
          .filter((l) => !l.newOnly || dateIso >= midPriceChangeIso)
          .map((l) => ({ item: l, weight: l.weight }));
        const layanan = pickWeighted(rng, availLayanan);
        const kodeDiag = pickWeighted(rng, diagWeights);

        // 75% kunjungan mendapat 1–2 item obat resep
        const visitMeds = [];
        if (rng() < 0.78) {
          const med1 = prescribedPool[Math.floor(rng() * prescribedPool.length)];
          const qty1 = 1 + Math.floor(rng() * 2);
          visitMeds.push({ obat: med1, qty: qty1 });
          med1.usedQty += qty1;

          if (rng() < 0.32) {
            const med2 = prescribedPool[(med1.idx + 2) % prescribedPool.length];
            if (med2.id !== med1.id) {
              const qty2 = 1;
              visitMeds.push({ obat: med2, qty: qty2 });
              med2.usedQty += qty2;
            }
          }
        }

        // Penjamin & status pembayaran
        const rPay = rng();
        let jenisPenjamin = 'MANDIRI';
        let metodeBayar = 'TUNAI';
        if (rPay < 0.62) {
          jenisPenjamin = 'MANDIRI';
          const mRoll = rng();
          metodeBayar = mRoll < 0.55 ? 'TUNAI' : mRoll < 0.82 ? 'QRIS' : 'TRANSFER';
        } else if (rPay < 0.88) {
          jenisPenjamin = 'BPJS';
          metodeBayar = 'BPJS';
        } else {
          jenisPenjamin = 'ASURANSI';
          metodeBayar = 'TRANSFER';
        }

        // Status tagihan: ~88% LUNAS (termasuk 20 kasus DP -> Pelunasan!), ~5% DP/Cicilan BELUM_LUNAS, ~7% BELUM_LUNAS murni
        let billingMode = 'LUNAS_LANGSUNG';
        if (vIdx >= 635 && vIdx <= 646) {
          // Pastikan ada tagihan belum lunas terbaru (termasuk DP sebagian & belum bayar) untuk widget Admin!
          billingMode = vIdx % 3 === 0 ? 'DP_BELUM_LUNAS' : 'BELUM_LUNAS';
        } else if (vIdx % 29 === 0) {
          billingMode = 'DP_LALU_LUNAS';
        } else if (vIdx % 41 === 0) {
          billingMode = 'DP_BELUM_LUNAS';
        } else if (vIdx % 37 === 0) {
          billingMode = 'BELUM_LUNAS';
        }

        plannedVisits.push({
          vIdx,
          kunjunganId: demoUuid(0x0500, vIdx),
          reservasiId: demoUuid(0x0450, vIdx),
          pemeriksaanId: demoUuid(0x0600, vIdx),
          vitalId: demoUuid(0x0610, vIdx),
          dokumenId: demoUuid(0x0620, vIdx),
          tindakanId: demoUuid(0x0630, vIdx),
          resepId: visitMeds.length > 0 ? demoUuid(0x0700, vIdx) : null,
          tagihanId: demoUuid(0x0800, vIdx),
          pasienId,
          dateIso,
          dtWib,
          hh,
          mm,
          layanan,
          kodeDiag,
          visitMeds,
          jenisPenjamin,
          metodeBayar,
          billingMode
        });
      }

      // 15 Kunjungan Koreksi (koreksi_dari_id menunjuk kunjungan ke-10, 20, ..., 150)
      // Mengganti diagnosis kunjungan asal (menguji aturan: kunjungan koreksi tidak menambah total kunjungan,
      // dan tren diagnosis tidak menghitung ganda entri asal yang sudah dikoreksi!)
      const plannedCorrections = [];
      for (let c = 1; c <= 15; c++) {
        const orig = plannedVisits[c * 10 - 1];
        const altKode = orig.kodeDiag === 'Z34.8' ? 'D50.9' : 'Z34.8';
        plannedCorrections.push({
          cIdx: c,
          kunjunganId: demoUuid(0x0550, c),
          koreksiDariId: orig.kunjunganId,
          pasienId: orig.pasienId,
          reservasiId: orig.reservasiId,
          dateIso: orig.dateIso,
          dtWib: orig.dtWib,
          layanan: orig.layanan,
          kodeDiag: altKode,
          pemeriksaanId: demoUuid(0x0650, c),
          vitalId: demoUuid(0x0660, c),
          dokumenId: demoUuid(0x0670, c),
          tindakanId: demoUuid(0x0680, c)
        });
      }

      // 5. Tulis Obat, Harga_Obat, Batch_Obat, Stok_Batch Awal, dan Mutasi_Stok ('MASUK')
      const obatValues = [];
      const hargaObatValues = [];
      const batchValues = [];
      const stokBatchMap = new Map(); // batchId -> current qty
      const mutasiValues = [];
      let mutasiSeq = 1;

      for (const o of obatDefs) {
        const initialActiveStock = o.targetEndStock + o.usedQty;
        o.activeBatches = [];

        obatValues.push(
          `('${o.id}', '${o.kode}', N'${o.gen}', N'${o.dag}', '${o.kat}', '${o.btk}', '${o.sat}', 'Standar', '${o.gol}', ${o.min}, ${o.targetEndStock}, 1)`
        );

        if (o.hrgLama !== o.hrgBaru) {
          hargaObatValues.push(
            `('${demoUuid(0x0310, o.idx * 10 + 1)}', '${o.id}', '${stafUtamaId}', ${o.hrgLama}, '${addDaysIso(startIso, -30)}', '${prevDayBeforeChangeIso}', N'Harga awal obat [DEMO-DASH]')`,
            `('${demoUuid(0x0310, o.idx * 10 + 2)}', '${o.id}', '${stafUtamaId}', ${o.hrgBaru}, '${midPriceChangeIso}', ${o.hrgFuture ? `'${addDaysIso(futurePriceIso, -1)}'` : 'NULL'}, N'Penyesuaian harga obat tengah periode [DEMO-DASH]')`
          );
          if (o.hrgFuture) {
            hargaObatValues.push(
              `('${demoUuid(0x0310, o.idx * 10 + 3)}', '${o.id}', '${stafUtamaId}', ${o.hrgFuture}, '${futurePriceIso}', NULL, N'Harga terjadwal masa depan [DEMO-DASH]')`
            );
          }
        } else {
          hargaObatValues.push(
            `('${demoUuid(0x0310, o.idx * 10 + 1)}', '${o.id}', '${stafUtamaId}', ${o.hrgLama}, '${addDaysIso(startIso, -30)}', NULL, N'Harga standar obat [DEMO-DASH]')`
          );
        }

        const hargaBeli = Math.max(1000, Math.round(o.hrgLama * 0.65));
        const tglMasukBatch = addDaysIso(startIso, -20);

        if (o.expMode === 'EXPIRED_PLUS_SAFE') {
          const expBatchId = demoUuid(0x0320, o.idx * 10 + 1);
          const safeBatchId = demoUuid(0x0320, o.idx * 10 + 2);
          batchValues.push(
            `('${expBatchId}', '${o.id}', NULL, 'DMBATCH-${o.idx}-EXP', '${addDaysIso(todayIso, -20)}', ${hargaBeli}, '${addDaysIso(startIso, -180)}')`,
            `('${safeBatchId}', '${o.id}', NULL, 'DMBATCH-${o.idx}-SAFE', '${addDaysIso(todayIso, 240)}', ${hargaBeli}, '${tglMasukBatch}')`
          );
          stokBatchMap.set(expBatchId, 9);
          stokBatchMap.set(safeBatchId, initialActiveStock);
          mutasiValues.push(
            `('${demoUuid(0x0750, mutasiSeq++)}', '${expBatchId}', '${gudangId}', NULL, '${stafUtamaId}', 'MASUK', 9, '${addDaysIso(startIso, -180)} 08:00:00', N'Saldo masuk batch lama [DEMO-DASH]')`,
            `('${demoUuid(0x0750, mutasiSeq++)}', '${safeBatchId}', '${gudangId}', NULL, '${stafUtamaId}', 'MASUK', ${initialActiveStock}, '${tglMasukBatch} 08:00:00', N'Saldo masuk batch aktif [DEMO-DASH]')`
          );
          o.activeBatches.push({ batchId: safeBatchId, remaining: initialActiveStock });
        } else if (o.expMode === 'EXPIRED_ONLY') {
          const expBatchId = demoUuid(0x0320, o.idx * 10 + 1);
          batchValues.push(
            `('${expBatchId}', '${o.id}', NULL, 'DMBATCH-${o.idx}-EXP', '${addDaysIso(todayIso, -10)}', ${hargaBeli}, '${addDaysIso(startIso, -150)}')`
          );
          stokBatchMap.set(expBatchId, 7);
          mutasiValues.push(
            `('${demoUuid(0x0750, mutasiSeq++)}', '${expBatchId}', '${gudangId}', NULL, '${stafUtamaId}', 'MASUK', 7, '${addDaysIso(startIso, -150)} 08:00:00', N'Saldo masuk batch kedaluwarsa [DEMO-DASH]')`
          );
        } else if (o.expMode === 'ZERO') {
          // Masuk 10 lalu dipakai koreksi/habis 10 sehingga stok_akhir = 0 (menguji kasus tepi stok = 0!)
          const zeroBatchId = demoUuid(0x0320, o.idx * 10 + 1);
          batchValues.push(
            `('${zeroBatchId}', '${o.id}', NULL, 'DMBATCH-${o.idx}-ZERO', '${addDaysIso(todayIso, 180)}', ${hargaBeli}, '${tglMasukBatch}')`
          );
          stokBatchMap.set(zeroBatchId, 0);
          mutasiValues.push(
            `('${demoUuid(0x0750, mutasiSeq++)}', '${zeroBatchId}', '${gudangId}', NULL, '${stafUtamaId}', 'MASUK', 10, '${tglMasukBatch} 08:00:00', N'Saldo awal batch [DEMO-DASH]')`,
            `('${demoUuid(0x0750, mutasiSeq++)}', '${zeroBatchId}', '${gudangId}', NULL, '${stafUtamaId}', 'PAKAI', -10, '${addDaysIso(startIso, -5)} 10:00:00', N'Habis terpakai sebelum periode [DEMO-DASH]')`
          );
        } else {
          let expIso = addDaysIso(todayIso, 270);
          if (o.expMode === 'NEAR_35D') expIso = addDaysIso(todayIso, 35);
          if (o.expMode === 'EXACT_3M') expIso = exact3MonthsIso; // Tepat di batas 3 bulan!

          if (o.prescribed) {
            // Bagi ke 2 batch (batch FEFO lebih dekat & batch cadangan lebih jauh) untuk menguji pemotongan multi-batch FEFO!
            const b1Qty = Math.floor(initialActiveStock * 0.45);
            const b2Qty = initialActiveStock - b1Qty;
            const b1Id = demoUuid(0x0320, o.idx * 10 + 1);
            const b2Id = demoUuid(0x0320, o.idx * 10 + 2);
            batchValues.push(
              `('${b1Id}', '${o.id}', NULL, 'DMBATCH-${o.idx}-A', '${addDaysIso(todayIso, 150)}', ${hargaBeli}, '${tglMasukBatch}')`,
              `('${b2Id}', '${o.id}', NULL, 'DMBATCH-${o.idx}-B', '${addDaysIso(todayIso, 330)}', ${hargaBeli}, '${tglMasukBatch}')`
            );
            stokBatchMap.set(b1Id, b1Qty);
            stokBatchMap.set(b2Id, b2Qty);
            mutasiValues.push(
              `('${demoUuid(0x0750, mutasiSeq++)}', '${b1Id}', '${gudangId}', NULL, '${stafUtamaId}', 'MASUK', ${b1Qty}, '${tglMasukBatch} 08:00:00', N'Penerimaan batch A [DEMO-DASH]')`,
              `('${demoUuid(0x0750, mutasiSeq++)}', '${b2Id}', '${gudangId}', NULL, '${stafUtamaId}', 'MASUK', ${b2Qty}, '${tglMasukBatch} 08:05:00', N'Penerimaan batch B [DEMO-DASH]')`
            );
            o.activeBatches.push(
              { batchId: b1Id, remaining: b1Qty },
              { batchId: b2Id, remaining: b2Qty }
            );
          } else {
            const bId = demoUuid(0x0320, o.idx * 10 + 1);
            batchValues.push(
              `('${bId}', '${o.id}', NULL, 'DMBATCH-${o.idx}-A', '${expIso}', ${hargaBeli}, '${tglMasukBatch}')`
            );
            stokBatchMap.set(bId, initialActiveStock);
            mutasiValues.push(
              `('${demoUuid(0x0750, mutasiSeq++)}', '${bId}', '${gudangId}', NULL, '${stafUtamaId}', 'MASUK', ${initialActiveStock}, '${tglMasukBatch} 08:00:00', N'Penerimaan awal batch [DEMO-DASH]')`
            );
            o.activeBatches.push({ batchId: bId, remaining: initialActiveStock });
          }
        }
      }

      // 6. Buat Jadwal_Praktik per tanggal (105 hari) + Reservasi (650 SELESAI + 25 DIBATALKAN)
      const jadwalByDate = new Map();
      const jadwalValues = [];
      for (let d = 0; d <= 104; d++) {
        const dIso = addDaysIso(startIso, d);
        const jId = demoUuid(0x0400, d + 1);
        jadwalByDate.set(dIso, jId);
        jadwalValues.push(
          `('${jId}', '${stafUtamaId}', '${unitId}', '${ruanganId}', '${dIso}', '08:00:00', '20:00:00', 30, 15, 1)`
        );
      }

      const reservasiValues = [];
      const kunjunganValues = [];
      const pemeriksaanValues = [];
      const vitalValues = [];
      const dokumenValues = [];
      const kunjDiagValues = [];
      const tindakanValues = [];
      const resepValues = [];
      const resepDetailValues = [];
      const pengeluaranValues = [];
      const tagihanValues = [];
      const rincianValues = [];
      const pembayaranValues = [];

      let pengeluaranSeq = 1;
      let rincianSeq = 1;
      let bayarSeq = 1;
      const antreanPerDate = new Map();

      for (const v of plannedVisits) {
        const antreanNo = (antreanPerDate.get(v.dateIso) || 0) + 1;
        antreanPerDate.set(v.dateIso, antreanNo);
        const jadwalId = jadwalByDate.get(v.dateIso);
        const penjaminId = penjaminByJenis[v.jenisPenjamin];
        const diagObj = diagByKode[v.kodeDiag];

        reservasiValues.push(
          `('${v.reservasiId}', '${v.pasienId}', '${jadwalId}', '${v.layanan.id}', ${akunPembuatSql}, ${antreanNo}, '${pad2(v.hh)}:${pad2(v.mm)}:00', 'SELESAI', 'WALK_IN', '${v.dtWib}')`
        );

        kunjunganValues.push(
          `('${v.kunjunganId}', '${v.pasienId}', '${v.reservasiId}', '${unitId}', '${stafUtamaId}', '${penjaminId}', NULL, 'RAWAT_JALAN', '${v.dateIso}', NULL, 'PULANG', 'SELESAI', '${v.dtWib}')`
        );

        pemeriksaanValues.push(
          `('${v.pemeriksaanId}', '${v.kunjunganId}', '${stafUtamaId}', N'Kontrol rutin ${v.layanan.nama}', N'Keadaan umum baik, kesadaran composmentis', N'${diagObj.nama}', N'${v.layanan.nama} & edukasi kesehatan ibu-anak', N'[DEMO-DASH]', '${v.dtWib}')`
        );

        vitalValues.push(
          `('${v.vitalId}', '${v.pemeriksaanId}', 115, 75, 82, 36.6, 20, 99, 58.5, 156.0, '${v.dtWib}')`
        );

        dokumenValues.push(
          `('${v.dokumenId}', '${v.kunjunganId}', '${stafUtamaId}', 'RME', 'DMRME-${String(v.vIdx).padStart(4, '0')}', N'{"diagnosa":"${diagObj.nama}","kode_icd10":"${diagObj.kode_icd}","demo":true}', '${v.dateIso}')`
        );

        kunjDiagValues.push(
          `('${v.kunjunganId}', '${diagObj.diagnosa_id}', 'UTAMA', N'${diagObj.nama}')`
        );

        tindakanValues.push(
          `('${v.tindakanId}', '${v.kunjunganId}', '${v.layanan.id}', '${stafUtamaId}', 1, '${v.dtWib}')`
        );

        // Hitung rincian tagihan (layanan + obat) memakai harga efektif pada tanggal kunjungan!
        let totalTagihan = 0;
        const hrgLay = getEffectiveLayananPrice(v.layanan, v.dateIso);
        totalTagihan += hrgLay;
        rincianValues.push(
          `('${demoUuid(0x0810, rincianSeq++)}', '${v.tagihanId}', NULL, '${v.layanan.id}', NULL, 1, ${hrgLay}, ${hrgLay})`
        );

        if (v.visitMeds.length > 0) {
          resepValues.push(
            `('${v.resepId}', '${v.kunjunganId}', '${stafUtamaId}', '${v.dateIso}', 'DISERAHKAN', 0, NULL)`
          );
          for (const vm of v.visitMeds) {
            resepDetailValues.push(
              `('${v.resepId}', '${vm.obat.id}', ${vm.qty}, N'2x1 sesudah makan')`
            );

            // Potong batch aktif secara FEFO
            let rem = vm.qty;
            for (const bSlot of vm.obat.activeBatches) {
              if (rem <= 0) break;
              if (bSlot.remaining <= 0) continue;
              const take = Math.min(rem, bSlot.remaining);
              bSlot.remaining -= take;
              stokBatchMap.set(bSlot.batchId, stokBatchMap.get(bSlot.batchId) - take);

              pengeluaranValues.push(
                `('${demoUuid(0x0720, pengeluaranSeq++)}', '${v.resepId}', '${vm.obat.id}', '${bSlot.batchId}', '${gudangId}', '${stafUtamaId}', ${take}, '${v.dtWib}')`
              );
              mutasiValues.push(
                `('${demoUuid(0x0750, mutasiSeq++)}', '${bSlot.batchId}', '${gudangId}', '${v.kunjunganId}', '${stafUtamaId}', 'PAKAI', ${-take}, '${v.dtWib}', N'Pemakaian resep RME [DEMO-DASH]')`
              );
              rem -= take;
            }
            assert.strictEqual(rem, 0, `Stok FEFO demo harus mencukupi untuk ${vm.obat.kode}`);

            const hrgObt = getEffectiveObatPrice(vm.obat, v.dateIso);
            const subObt = hrgObt * vm.qty;
            totalTagihan += subObt;
            rincianValues.push(
              `('${demoUuid(0x0810, rincianSeq++)}', '${v.tagihanId}', '${vm.obat.id}', NULL, NULL, ${vm.qty}, ${hrgObt}, ${subObt})`
            );
          }
        }

        // Pembayaran sesuai skenario
        if (v.billingMode === 'LUNAS_LANGSUNG') {
          tagihanValues.push(
            `('${v.tagihanId}', '${v.kunjunganId}', ${totalTagihan}, ${totalTagihan}, 'LUNAS', '${v.dateIso}')`
          );
          pembayaranValues.push(
            `('${demoUuid(0x0900, bayarSeq++)}', '${v.tagihanId}', '${penjaminId}', '${stafKasirId}', ${totalTagihan}, '${v.metodeBayar}', 'PELUNASAN', '${v.dtWib}')`
          );
        } else if (v.billingMode === 'DP_LALU_LUNAS') {
          const dpNominal = Math.floor(totalTagihan * 0.4);
          const pelunasanNominal = totalTagihan - dpNominal;
          const pelunasanIso = v.dateIso < todayIso ? addDaysIso(v.dateIso, 1) : v.dateIso;
          tagihanValues.push(
            `('${v.tagihanId}', '${v.kunjunganId}', ${totalTagihan}, ${totalTagihan}, 'LUNAS', '${v.dateIso}')`
          );
          pembayaranValues.push(
            `('${demoUuid(0x0900, bayarSeq++)}', '${v.tagihanId}', '${penjaminId}', '${stafKasirId}', ${dpNominal}, '${v.metodeBayar}', 'UANG_MUKA', '${v.dtWib}')`,
            `('${demoUuid(0x0900, bayarSeq++)}', '${v.tagihanId}', '${penjaminId}', '${stafKasirId}', ${pelunasanNominal}, '${v.metodeBayar}', 'PELUNASAN', '${pelunasanIso} 10:15:00')`
          );
        } else if (v.billingMode === 'DP_BELUM_LUNAS') {
          const dpNominal = Math.floor(totalTagihan * 0.5);
          tagihanValues.push(
            `('${v.tagihanId}', '${v.kunjunganId}', ${totalTagihan}, ${dpNominal}, 'BELUM_LUNAS', '${v.dateIso}')`
          );
          pembayaranValues.push(
            `('${demoUuid(0x0900, bayarSeq++)}', '${v.tagihanId}', '${penjaminId}', '${stafKasirId}', ${dpNominal}, 'TUNAI', 'UANG_MUKA', '${v.dtWib}')`
          );
        } else {
          tagihanValues.push(
            `('${v.tagihanId}', '${v.kunjunganId}', ${totalTagihan}, 0, 'BELUM_LUNAS', '${v.dateIso}')`
          );
        }
      }

      // Tambahkan 15 Kunjungan Koreksi (koreksi_dari_id IS NOT NULL)
      const kunjunganKorValues = [];
      for (const c of plannedCorrections) {
        const diagObj = diagByKode[c.kodeDiag];
        const penjaminId = penjaminByJenis.MANDIRI;
        kunjunganKorValues.push(
          `('${c.kunjunganId}', '${c.pasienId}', NULL, '${unitId}', '${stafUtamaId}', '${penjaminId}', '${c.koreksiDariId}', 'RAWAT_JALAN', '${c.dateIso}', NULL, 'PULANG', 'SELESAI', '${c.dtWib}')`
        );
        pemeriksaanValues.push(
          `('${c.pemeriksaanId}', '${c.kunjunganId}', '${stafUtamaId}', N'Koreksi asesmen kunjungan', N'Dalam batas normal (entri koreksi)', N'${diagObj.nama}', N'Koreksi diagnosis asuhan kebidanan', N'Koreksi dari ${c.koreksiDariId} [DEMO-DASH]', '${c.dtWib}')`
        );
        vitalValues.push(
          `('${c.vitalId}', '${c.pemeriksaanId}', 118, 76, 80, 36.5, 20, 99, 59.0, 156.0, '${c.dtWib}')`
        );
        dokumenValues.push(
          `('${c.dokumenId}', '${c.kunjunganId}', '${stafUtamaId}', 'RME', 'DMRME-KOR-${pad2(c.cIdx)}', N'{"diagnosa":"${diagObj.nama}","koreksi_dari_id":"${c.koreksiDariId}"}', '${c.dateIso}')`
        );
        kunjDiagValues.push(
          `('${c.kunjunganId}', '${diagObj.diagnosa_id}', 'UTAMA', N'Koreksi diagnosis [DEMO-DASH]')`
        );
        tindakanValues.push(
          `('${c.tindakanId}', '${c.kunjunganId}', '${c.layanan.id}', '${stafUtamaId}', 1, '${c.dtWib}')`
        );
      }

      // Tambahkan 25 Reservasi DIBATALKAN (termasuk 5 baris Kunjungan yang tertaut reservasi DIBATALKAN untuk menguji filter eksklusi!)
      for (let b = 1; b <= 25; b++) {
        const dIso = b <= 3 ? todayIso : addDaysIso(todayIso, -(b * 3));
        const jId = jadwalByDate.get(dIso) || jadwalByDate.get(todayIso);
        const rsvBatalId = demoUuid(0x0490, b);
        const pid = pasienIds[(b * 5) % pasienIds.length];
        const layId = layananDefs[b % 5].id;
        const antNo = (antreanPerDate.get(dIso) || 0) + 1;
        antreanPerDate.set(dIso, antNo);

        reservasiValues.push(
          `('${rsvBatalId}', '${pid}', '${jId}', '${layId}', ${akunPembuatSql}, ${antNo}, '10:30:00', 'DIBATALKAN', 'ONLINE', '${dIso} 07:30:00')`
        );

        if (b <= 5) {
          kunjunganKorValues.push(
            `('${demoUuid(0x0590, b)}', '${pid}', '${rsvBatalId}', '${unitId}', '${stafUtamaId}', '${penjaminByJenis.MANDIRI}', NULL, 'RAWAT_JALAN', '${dIso}', NULL, NULL, 'BATAL', '${dIso} 07:35:00')`
          );
        }
      }

      // Eksekusi seluruh batch INSERT secara berurutan sesuai relasi FK
      await execBatchedValues(
        makeReq,
        `INSERT INTO dbo.[Obat] (obat_id, kode, nama_generik, nama_dagang, kategori, bentuk, satuan, kekuatan, golongan, stok_minimum, stok_saat_ini, aktif)`,
        obatValues
      );
      await execBatchedValues(
        makeReq,
        `INSERT INTO dbo.[Harga_Obat] (harga_obat_id, obat_id, diubah_oleh, harga_jual, berlaku_dari, berlaku_sampai, alasan)`,
        hargaObatValues
      );
      await execBatchedValues(
        makeReq,
        `INSERT INTO dbo.[Batch_Obat] (batch_id, obat_id, penerimaan_id, no_batch, tgl_kedaluwarsa, harga_beli, tgl_masuk)`,
        batchValues
      );

      const stokBatchValues = [...stokBatchMap.entries()].map(
        ([bid, qty]) => `('${bid}', '${gudangId}', ${qty})`
      );
      await execBatchedValues(
        makeReq,
        `INSERT INTO dbo.[Stok_Batch] (batch_id, gudang_id, jumlah)`,
        stokBatchValues
      );

      await execBatchedValues(
        makeReq,
        `INSERT INTO dbo.[Jadwal_Praktik] (jadwal_id, staf_id, unit_id, ruangan_id, tanggal, jam_mulai, jam_selesai, kuota_maks, durasi_per_pasien, aktif)`,
        jadwalValues
      );
      await execBatchedValues(
        makeReq,
        `INSERT INTO dbo.[Reservasi] (reservasi_id, pasien_id, jadwal_id, layanan_id, dibuat_oleh, nomor_antrean, estimasi_jam, status, metode_daftar, created_at)`,
        reservasiValues
      );
      await execBatchedValues(
        makeReq,
        `INSERT INTO dbo.[Kunjungan] (kunjungan_id, pasien_id, reservasi_id, unit_id, dpjp_staf_id, penjamin_id, koreksi_dari_id, jenis_kunjungan, tgl_masuk, tgl_keluar, cara_keluar, status, created_at)`,
        kunjunganValues
      );
      await execBatchedValues(
        makeReq,
        `INSERT INTO dbo.[Kunjungan] (kunjungan_id, pasien_id, reservasi_id, unit_id, dpjp_staf_id, penjamin_id, koreksi_dari_id, jenis_kunjungan, tgl_masuk, tgl_keluar, cara_keluar, status, created_at)`,
        kunjunganKorValues
      );
      await execBatchedValues(
        makeReq,
        `INSERT INTO dbo.[Pemeriksaan] (pemeriksaan_id, kunjungan_id, staf_id, keluhan, pemeriksaan_fisik, asesmen, rencana, catatan_bebas, waktu)`,
        pemeriksaanValues
      );
      await execBatchedValues(
        makeReq,
        `INSERT INTO dbo.[Tanda_Vital] (vital_id, pemeriksaan_id, sistolik, diastolik, nadi, suhu, frekuensi_napas, spo2, berat_badan, tinggi_badan, waktu)`,
        vitalValues
      );
      await execBatchedValues(
        makeReq,
        `INSERT INTO dbo.[Dokumen_Medis] (dokumen_id, kunjungan_id, staf_id, jenis, no_dokumen, isi, tgl_terbit)`,
        dokumenValues
      );
      await execBatchedValues(
        makeReq,
        `INSERT INTO dbo.[Kunjungan_Diagnosa] (kunjungan_id, diagnosa_id, jenis, keterangan)`,
        kunjDiagValues
      );
      await execBatchedValues(
        makeReq,
        `INSERT INTO dbo.[Tindakan_Kunjungan] (tindakan_id, kunjungan_id, layanan_id, staf_id, qty, waktu)`,
        tindakanValues
      );
      await execBatchedValues(
        makeReq,
        `INSERT INTO dbo.[Resep] (resep_id, kunjungan_id, staf_id, tanggal, status, override_alergi, alasan_override)`,
        resepValues
      );
      await execBatchedValues(
        makeReq,
        `INSERT INTO dbo.[Resep_Detail] (resep_id, obat_id, jumlah, aturan_pakai)`,
        resepDetailValues
      );
      await execBatchedValues(
        makeReq,
        `INSERT INTO dbo.[Pengeluaran_Obat] (pengeluaran_id, resep_id, obat_id, batch_id, gudang_id, apoteker_staf_id, jumlah, waktu)`,
        pengeluaranValues
      );
      await execBatchedValues(
        makeReq,
        `INSERT INTO dbo.[Mutasi_Stok] (mutasi_id, batch_id, gudang_id, kunjungan_id, staf_id, jenis, jumlah, waktu, keterangan)`,
        mutasiValues
      );
      await execBatchedValues(
        makeReq,
        `INSERT INTO dbo.[Tagihan] (tagihan_id, kunjungan_id, total_tagihan, total_dibayar, status, tgl_terbit)`,
        tagihanValues
      );
      await execBatchedValues(
        makeReq,
        `INSERT INTO dbo.[Tagihan_Rincian] (rincian_id, tagihan_id, obat_id, layanan_id, paket_id, qty, harga_satuan, subtotal)`,
        rincianValues
      );
      await execBatchedValues(
        makeReq,
        `INSERT INTO dbo.[Pembayaran] (pembayaran_id, tagihan_id, penjamin_id, kasir_staf_id, jumlah, metode, jenis, waktu_bayar)`,
        pembayaranValues
      );

      await tx.commit();
    } catch (err) {
      await tx.rollback();
      throw err;
    }

    // 7. Verifikasi Invarian Matematika Wajib Fase 2 langsung di SQL Server
    const invCheck = await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM dbo.[Kunjungan] WHERE kunjungan_id LIKE 'DD000000-%' AND koreksi_dari_id IS NULL AND status <> 'BATAL') AS demo_kunjungan_utama,
        (SELECT COUNT(*) FROM dbo.[Kunjungan] WHERE kunjungan_id LIKE 'DD000000-%' AND koreksi_dari_id IS NOT NULL) AS demo_kunjungan_koreksi,
        (SELECT COUNT(*) FROM dbo.[Reservasi] WHERE reservasi_id LIKE 'DD000000-%' AND status = 'DIBATALKAN') AS demo_reservasi_batal,
        (SELECT COUNT(DISTINCT diagnosa_id) FROM dbo.[Kunjungan_Diagnosa] WHERE kunjungan_id LIKE 'DD000000-%') AS variasi_diagnosa,
        (SELECT COUNT(*) FROM dbo.[Obat] WHERE kode LIKE 'DMOBT-%') AS demo_obat,
        (SELECT DATEDIFF(DAY, MIN(tgl_masuk), MAX(tgl_masuk)) + 1 FROM dbo.[Kunjungan] WHERE kunjungan_id LIKE 'DD000000-%') AS rentang_hari,
        (SELECT COUNT(*) FROM (
           SELECT t.tagihan_id
             FROM dbo.[Tagihan] t
             LEFT JOIN dbo.[Tagihan_Rincian] tr ON tr.tagihan_id = t.tagihan_id
            GROUP BY t.tagihan_id, t.total_tagihan
           HAVING t.total_tagihan <> ISNULL(SUM(tr.subtotal), 0)
        ) x) AS pelanggaran_rincian_tagihan,
        (SELECT COUNT(*) FROM (
           SELECT t.tagihan_id
             FROM dbo.[Tagihan] t
             LEFT JOIN dbo.[Pembayaran] pb ON pb.tagihan_id = t.tagihan_id
            GROUP BY t.tagihan_id, t.total_dibayar, t.total_tagihan
           HAVING t.total_dibayar <> ISNULL(SUM(pb.jumlah), 0)
               OR t.total_dibayar > t.total_tagihan
        ) y) AS pelanggaran_pembayaran_tagihan,
        (SELECT COUNT(*) FROM (
           SELECT sb.batch_id
             FROM dbo.[Stok_Batch] sb
             LEFT JOIN dbo.[Mutasi_Stok] ms ON ms.batch_id = sb.batch_id AND ms.gudang_id = sb.gudang_id
            WHERE sb.batch_id LIKE 'DD000000-%'
            GROUP BY sb.batch_id, sb.jumlah
           HAVING sb.jumlah <> ISNULL(SUM(ms.jumlah), 0) OR sb.jumlah < 0
        ) z) AS pelanggaran_mutasi_stok
    `);

    const stats = invCheck.recordset[0];
    console.log('\n=============================================================');
    console.log(' Hasil Seed Deterministik Fase 2 & Verifikasi Invarian DB');
    console.log('=============================================================');
    console.table([stats]);

    assert(stats.rentang_hari >= 90, 'Rentang riwayat wajib >= 90 hari');
    assert(stats.demo_kunjungan_utama >= 600, 'Kunjungan utama wajib >= 600');
    assert(stats.variasi_diagnosa >= 12, 'Variasi diagnosis wajib >= 12');
    assert(stats.demo_obat >= 20, 'Jumlah obat demo wajib >= 20');
    assert.strictEqual(stats.pelanggaran_rincian_tagihan, 0, 'Jumlah rincian wajib = total tagihan');
    assert.strictEqual(stats.pelanggaran_pembayaran_tagihan, 0, 'Total pembayaran wajib = total_dibayar <= total_tagihan');
    assert.strictEqual(stats.pelanggaran_mutasi_stok, 0, 'Stok akhir wajib = stok awal + masuk - pakai');

    console.log('[SUKSES] Seluruh syarat volume & invarian matematika Fase 2 terpenuhi (0 pelanggaran)!');
  } finally {
    await pool.close();
  }
}

main().catch((err) => {
  console.error('[ERROR SEED DEMO]', err);
  process.exit(1);
});
