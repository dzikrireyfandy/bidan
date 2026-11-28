import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import config from '../src/config/env';
import db from '../src/db/pool';
import v1Router from '../src/routes/v1';
import { signToken } from '../src/middleware/auth';
import { errorHandler, notFoundHandler } from '../src/middleware/errorHandler';
import { tentukanStatusStokItem } from '../src/services/dashboard.service';
import { hitungEfekVolumeDanHarga, LaporanService } from '../src/services/laporan.service';
import LaporanRepository from '../src/repositories/laporan.repository';
import * as pdfBuilder from '../src/utils/pdfReportBuilder';

const app = express();
app.use(express.json());
app.use('/api/v1', v1Router);
app.use(notFoundHandler);
app.use(errorHandler);

const BIDAN_STAF_ID = '11111111-1111-1111-1111-111111111111';
const ADMIN_STAF_ID = '22222222-2222-2222-2222-222222222222';

const tokenBidan = signToken({
  akunId: 'akun-bidan-qa',
  peran: 'DOKTER',
  stafId: BIDAN_STAF_ID
});

const tokenAdmin = signToken({
  akunId: 'akun-admin-qa',
  peran: 'ADMIN_LOKAL',
  stafId: ADMIN_STAF_ID
});

describe('Fase 5 — Unit Test Rumus Efek Harga & Status Stok (Kasus Tepi Matematika)', () => {
  test('rumus efek volume & efek harga: perubahan harga + volume normal, rekonsiliasi selisih = 0', () => {
    const hasil = hitungEfekVolumeDanHarga(
      [
        {
          tipe_item: 'LAYANAN',
          item_id: 'LAY-1',
          kode_item: 'DMLAY-01',
          nama_item: 'ANC Terpadu',
          qty: 15,
          pendapatan: 15 * 90000 // Rp 1.350.000
        }
      ],
      [
        {
          tipe_item: 'LAYANAN',
          item_id: 'LAY-1',
          kode_item: 'DMLAY-01',
          nama_item: 'ANC Terpadu',
          qty: 10,
          pendapatan: 10 * 75000 // Rp 750.000
        }
      ]
    );

    const item = hasil.items[0]!;
    // efek_volume = (15 - 10) * 75.000 = 375.000
    // efek_harga  = (90.000 - 75.000) * 15 = 225.000
    // jumlah      = 600.000 === 1.350.000 - 750.000
    expect(item.efek_volume).toBe(375000);
    expect(item.efek_harga).toBe(225000);
    expect(item.selisih_pendapatan).toBe(600000);
    expect(item.efek_volume + item.efek_harga).toBe(item.selisih_pendapatan);
    expect(hasil.ringkasan.total_efek_volume + hasil.ringkasan.total_efek_harga).toBe(
      hasil.ringkasan.total_selisih
    );
  });

  test('kasus tepi item hanya di satu periode & pembagi nol (qty=0): seluruh selisih masuk efek volume, bebas NaN/Infinity', () => {
    const hasil = hitungEfekVolumeDanHarga(
      [
        {
          tipe_item: 'LAYANAN',
          item_id: 'LAY-BARU',
          kode_item: 'DMLAY-08',
          nama_item: 'Senam Hamil',
          qty: 6,
          pendapatan: 300000
        },
        {
          tipe_item: 'OBAT',
          item_id: 'OBT-NOL',
          kode_item: 'DMOBT-00',
          nama_item: 'Item Nol',
          qty: 0,
          pendapatan: 0
        }
      ],
      [
        {
          tipe_item: 'LAYANAN',
          item_id: 'LAY-LAMA',
          kode_item: 'DMLAY-99',
          nama_item: 'Layanan Lama',
          qty: 4,
          pendapatan: 200000
        }
      ]
    );

    const itemBaru = hasil.items.find((i) => i.item_id === 'LAY-BARU')!;
    expect(itemBaru.hanya_satu_periode).toBe(true);
    expect(itemBaru.efek_volume).toBe(300000);
    expect(itemBaru.efek_harga).toBe(0);

    const itemLama = hasil.items.find((i) => i.item_id === 'LAY-LAMA')!;
    expect(itemLama.hanya_satu_periode).toBe(true);
    expect(itemLama.efek_volume).toBe(-200000);
    expect(itemLama.efek_harga).toBe(0);

    const itemNol = hasil.items.find((i) => i.item_id === 'OBT-NOL')!;
    expect(Number.isFinite(itemNol.efek_volume)).toBe(true);
    expect(Number.isFinite(itemNol.efek_harga)).toBe(true);
    expect(hasil.ringkasan.total_efek_volume + hasil.ringkasan.total_efek_harga).toBe(
      hasil.ringkasan.total_selisih
    );
  });

  test('kasus tepi status stok: stok = stok_minimum (AMAN), stok = 0 (MENIPIS), kedaluwarsa tepat 3 bulan (MENDEKATI_KEDALUWARSA), dan KEDALUWARSA', () => {
    const hariIni = '2026-11-28';
    const batas3Bulan = '2027-02-28';

    // 1. stok = stok_minimum tepat -> AMAN (bukan MENIPIS)
    const tepatMin = tentukanStatusStokItem({
      stokAktif: 15,
      stokMinimum: 15,
      stokKedaluwarsa: 0,
      tglExpAktifTerdekat: '2027-08-01',
      hariIniIso: hariIni,
      batas3BulanIso: batas3Bulan
    });
    expect(tepatMin.status_utama).toBe('AMAN');
    expect(tepatMin.is_peringatan).toBe(false);

    // 2. stok = 0 -> MENIPIS
    const stokNol = tentukanStatusStokItem({
      stokAktif: 0,
      stokMinimum: 10,
      stokKedaluwarsa: 0,
      tglExpAktifTerdekat: null,
      hariIniIso: hariIni,
      batas3BulanIso: batas3Bulan
    });
    expect(stokNol.status_utama).toBe('MENIPIS');
    expect(stokNol.is_peringatan).toBe(true);

    // 3. kedaluwarsa TEPAT 3 bulan -> MENDEKATI_KEDALUWARSA
    const tepat3Bulan = tentukanStatusStokItem({
      stokAktif: 20,
      stokMinimum: 10,
      stokKedaluwarsa: 0,
      tglExpAktifTerdekat: '2027-02-28',
      hariIniIso: hariIni,
      batas3BulanIso: batas3Bulan
    });
    expect(tepat3Bulan.status_utama).toBe('MENDEKATI_KEDALUWARSA');
    expect(tepat3Bulan.is_peringatan).toBe(true);

    // 4. lewat 1 hari di atas 3 bulan -> AMAN
    const lewat3Bulan = tentukanStatusStokItem({
      stokAktif: 20,
      stokMinimum: 10,
      stokKedaluwarsa: 0,
      tglExpAktifTerdekat: '2027-03-01',
      hariIniIso: hariIni,
      batas3BulanIso: batas3Bulan
    });
    expect(lewat3Bulan.status_utama).toBe('AMAN');

    // 5. punya batch kedaluwarsa tapi stok aktif aman -> KEDALUWARSA
    const adaExp = tentukanStatusStokItem({
      stokAktif: 30,
      stokMinimum: 10,
      stokKedaluwarsa: 9,
      tglExpAktifTerdekat: '2027-09-01',
      hariIniIso: hariIni,
      batas3BulanIso: batas3Bulan
    });
    expect(adaExp.status_utama).toBe('KEDALUWARSA');
    expect(adaExp.daftar_status).toContain('KEDALUWARSA');
  });
});

describe('Fase 5 — Integrasi Live DB: Validasi, Kasus Tepi, Keamanan, Audit 403, & Bukti 100% Read-Only', () => {
  beforeAll(() => {
    process.env.RUN_LIVE_DB_TESTS = '1';
  });

  afterAll(async () => {
    delete process.env.RUN_LIVE_DB_TESTS;
    await db.close();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('validasi rentang tanggal: satu hari (lolos), pergantian tahun (lolos), tepat 366 hari (lolos), 367 hari (422), awal > akhir (422)', async () => {
    // 1. Awal > akhir -> 422
    const terbalik = await request(app)
      .post('/api/v1/keuangan/rekap-pendapatan/list')
      .set('Authorization', `Bearer ${tokenBidan}`)
      .send({ jenis_periode: 'KUSTOM', dari: '2026-11-20', sampai: '2026-11-10' });
    expect(terbalik.status).toBe(422);
    expect(terbalik.body.error.errorId).toBe('ERR-VAL-01');

    // 2. Rentang 367 hari kalender (2026-01-01 s/d 2027-01-02) -> 422
    const lebih366 = await request(app)
      .post('/api/v1/keuangan/rekap-pendapatan/list')
      .set('Authorization', `Bearer ${tokenBidan}`)
      .send({ jenis_periode: 'KUSTOM', dari: '2026-01-01', sampai: '2027-01-02' });
    expect(lebih366.status).toBe(422);
    expect(lebih366.body.error.errorId).toBe('ERR-VAL-01');

    // 3. Rentang TEPAT 366 hari kalender (2026-01-01 s/d 2027-01-01) -> 200 lolos!
    const tepat366 = await request(app)
      .post('/api/v1/keuangan/rekap-pendapatan/list')
      .set('Authorization', `Bearer ${tokenBidan}`)
      .send({ jenis_periode: 'KUSTOM', dari: '2026-01-01', sampai: '2027-01-01' });
    expect(tepat366.status).toBe(200);

    // 4. Satu hari tunggal -> 200 lolos!
    const satuHari = await request(app)
      .post('/api/v1/keuangan/rekap-pendapatan/list')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ jenis_periode: 'HARIAN', dari: '2026-11-28', sampai: '2026-11-28' });
    expect(satuHari.status).toBe(200);

    // 5. Pergantian bulan & tahun (Des 2025 - Jan 2026, periode kosong) -> Rekap Rp 0 + pesan info; Laporan 404 ERR-RPT-01!
    const lintasTahunRekap = await request(app)
      .post('/api/v1/keuangan/rekap-pendapatan/list')
      .set('Authorization', `Bearer ${tokenBidan}`)
      .send({ jenis_periode: 'KUSTOM', dari: '2020-12-15', sampai: '2021-01-15' });
    expect(lintasTahunRekap.status).toBe(200);
    expect(lintasTahunRekap.body.data.total_pendapatan).toBe(0);
    expect(lintasTahunRekap.body.data.kosong).toBe(true);
    expect(lintasTahunRekap.body.data.pesan_informasi).toBeTruthy();

    const lintasTahunLaporanKosong = await request(app)
      .post('/api/v1/laporan/ringkasan/list')
      .set('Authorization', `Bearer ${tokenBidan}`)
      .send({ jenis_periode: 'BULANAN', dari: '2020-12-15', sampai: '2021-01-15' });
    expect(lintasTahunLaporanKosong.status).toBe(404);
    expect(lintasTahunLaporanKosong.body.error.errorId).toBe('ERR-RPT-01');
    expect(lintasTahunLaporanKosong.body.error.message).toBe('Data belum tersedia untuk periode ini');
  });

  test('keamanan: Admin ke endpoint laporan ditolak 403 + tercatat di Audit_Log; Bidan tidak menerima tagihan_belum_lunas; token kedaluwarsa = 401; SQLi aman; bebas PII di laporan', async () => {
    const beforeAudit = await db.query<{ cnt: number }>(
      `SELECT COUNT(*) AS cnt FROM [Audit_Log] WHERE aksi = 'AKSES_DITOLAK' AND user_ref = 'akun-admin-qa'`
    );
    const cntAwal = Number(beforeAudit.recordset[0]?.cnt ?? 0);

    // 1. Admin mencoba membuka Laporan Operasional (khusus Bidan) -> 403 + Audit_Log bertambah!
    const res403 = await request(app)
      .post('/api/v1/laporan/ringkasan/list')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ dari: '2026-11-01', sampai: '2026-11-28' });
    expect(res403.status).toBe(403);
    expect(res403.body.error.message).toBe('Anda tidak memiliki izin untuk mengakses ini');

    const afterAudit = await db.query<{ cnt: number }>(
      `SELECT COUNT(*) AS cnt FROM [Audit_Log] WHERE aksi = 'AKSES_DITOLAK' AND user_ref = 'akun-admin-qa'`
    );
    expect(Number(afterAudit.recordset[0]?.cnt ?? 0)).toBeGreaterThan(cntAwal);

    // 2. Bidan memanggil Dashboard Internal -> tagihan_belum_lunas WAJIB null; Admin -> tagihan_belum_lunas berisi objek
    const dashBidan = await request(app)
      .post('/api/v1/dashboard/internal/list')
      .set('Authorization', `Bearer ${tokenBidan}`)
      .send({});
    expect(dashBidan.status).toBe(200);
    expect(dashBidan.body.data.tagihan_belum_lunas).toBeNull();

    const dashAdmin = await request(app)
      .post('/api/v1/dashboard/internal/list')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({});
    expect(dashAdmin.status).toBe(200);
    expect(dashAdmin.body.data.tagihan_belum_lunas).not.toBeNull();

    // 3. Token kedaluwarsa -> 401
    const expiredJwt = jwt.sign(
      { akunId: 'akun-exp', peran: 'DOKTER', subPeran: null, stafId: BIDAN_STAF_ID, pasienId: null },
      config.JWT_SECRET,
      { expiresIn: -30 }
    );
    const res401 = await request(app)
      .post('/api/v1/dashboard/internal/list')
      .set('Authorization', `Bearer ${expiredJwt}`)
      .send({});
    expect(res401.status).toBe(401);

    // 4. Uji SQL Injection pada parameter tanggal -> ditolak 422 & tabel tetap utuh
    const sqliRes = await request(app)
      .post('/api/v1/laporan/ringkasan/list')
      .set('Authorization', `Bearer ${tokenBidan}`)
      .send({ dari: "2026-11-01'; DROP TABLE Pasien;--", sampai: '2026-11-28' });
    expect(sqliRes.status).toBe(422);

    // 5. Respons Laporan tidak membocorkan identitas pasien (nama_pasien / nik / no_telepon)
    const lapValid = await request(app)
      .post('/api/v1/laporan/ringkasan/list')
      .set('Authorization', `Bearer ${tokenBidan}`)
      .send({});
    expect(lapValid.status).toBe(200);
    const rawJson = JSON.stringify(lapValid.body);
    expect(rawJson).not.toContain('nama_pasien');
    expect(rawJson).not.toContain('157199');
  });

  test('simulasi gagal buat berkas PDF/Excel = 500 "Gagal membuat berkas. Silakan coba lagi." & DB tidak tersedia = 503', async () => {
    // 1. Gagal buat PDF -> 500
    jest.spyOn(pdfBuilder, 'buildPdfReportBuffer').mockImplementationOnce(() => {
      throw new Error('Disk/stream penuh');
    });
    const expFail = await request(app)
      .post('/api/v1/laporan/export')
      .set('Authorization', `Bearer ${tokenBidan}`)
      .send({ format: 'PDF' });
    expect(expFail.status).toBe(500);
    expect(expFail.body.error.message).toBe('Gagal membuat berkas. Silakan coba lagi.');

    // 2. DB tidak tersedia -> 503
    jest.spyOn(db, 'query').mockRejectedValueOnce(
      Object.assign(new Error('Database down'), { code: 'ECONNREFUSED', name: 'ConnectionError' })
    );
    const dbDown = await request(app)
      .post('/api/v1/dashboard/internal/list')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({});
    expect(dbDown.status).toBe(503);
    expect(dbDown.body.error.errorId).toBe('ERR-SYS-01');
    expect(dbDown.body.error.message).toContain('Layanan tidak tersedia. Silakan coba lagi');
  });

  test('bukti jalur dashboard, laporan, ekspor PDF/Excel, & rekap pendapatan 100% hanya menjalankan SELECT (0 statement non-SELECT)', async () => {
    const capturedSql: string[] = [];
    const origQuery = db.query.bind(db);
    jest.spyOn(db, 'query').mockImplementation((async (text: string, params?: Record<string, unknown>, ctx?: never) => {
      capturedSql.push(text);
      return origQuery(text, params, ctx);
    }) as typeof db.query);
    const execSpy = jest.spyOn(db, 'execute');
    const txSpy = jest.spyOn(db, 'transaction');

    const r1 = await request(app)
      .post('/api/v1/dashboard/internal/list')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({});
    expect(r1.status).toBe(200);

    const r2 = await request(app)
      .post('/api/v1/laporan/ringkasan/list')
      .set('Authorization', `Bearer ${tokenBidan}`)
      .send({});
    expect(r2.status).toBe(200);

    const r3 = await request(app)
      .post('/api/v1/laporan/jam-tersibuk/list')
      .set('Authorization', `Bearer ${tokenBidan}`)
      .send({});
    expect(r3.status).toBe(200);

    const r4 = await request(app)
      .post('/api/v1/laporan/perbandingan/list')
      .set('Authorization', `Bearer ${tokenBidan}`)
      .send({
        dari: '2026-11-01',
        sampai: '2026-11-28',
        pembanding_dari: '2026-10-04',
        pembanding_sampai: '2026-10-31'
      });
    expect(r4.status).toBe(200);

    const r5 = await request(app)
      .post('/api/v1/laporan/export')
      .set('Authorization', `Bearer ${tokenBidan}`)
      .send({
        format: 'PDF',
        dari: '2026-11-01',
        sampai: '2026-11-28',
        pembanding_dari: '2026-10-04',
        pembanding_sampai: '2026-10-31'
      });
    expect(r5.status).toBe(200);
    expect(r5.headers['content-type']).toContain('application/pdf');

    const r6 = await request(app)
      .post('/api/v1/laporan/export')
      .set('Authorization', `Bearer ${tokenBidan}`)
      .send({
        format: 'EXCEL',
        dari: '2026-11-01',
        sampai: '2026-11-28',
        pembanding_dari: '2026-10-04',
        pembanding_sampai: '2026-10-31'
      });
    expect(r6.status).toBe(200);
    expect(r6.headers['content-type']).toContain('spreadsheetml');

    const r7 = await request(app)
      .post('/api/v1/keuangan/rekap-pendapatan/list')
      .set('Authorization', `Bearer ${tokenBidan}`)
      .send({ jenis_periode: 'BULANAN', dari: '2026-11-01', sampai: '2026-11-28' });
    expect(r7.status).toBe(200);

    expect(capturedSql.length).toBeGreaterThan(10);
    expect(execSpy).not.toHaveBeenCalled();
    expect(txSpy).not.toHaveBeenCalled();

    for (const sqlText of capturedSql) {
      expect(sqlText).not.toMatch(/\b(INSERT\s+INTO|UPDATE\s+|DELETE\s+FROM|MERGE\s+INTO|ALTER\s+TABLE|DROP\s+|TRUNCATE\s+)/i);
    }
  });

  test('kasus tepi kunjungan tepat 00:00:00 WIB dan 23:59:00 WIB dihitung tepat pada tanggal WIB yang bersangkutan', async () => {
    const repo = new LaporanRepository();
    const svc = new LaporanService(repo);
    const todayRes = await db.query<{ today_iso: string }>(
      `SELECT CONVERT(VARCHAR(10), CAST(SYSDATETIME() AS DATE), 23) AS today_iso`
    );
    const todayIso = todayRes.recordset[0]!.today_iso;

    // Pastikan data seed memiliki kunjungan jam 00:00:00 dan 23:59:00
    const boundaryCheck = await db.query<{ cnt_midnight: number; cnt_endday: number }>(
      `SELECT
         SUM(CASE WHEN CONVERT(VARCHAR(8), created_at, 108) = '00:00:00' THEN 1 ELSE 0 END) AS cnt_midnight,
         SUM(CASE WHEN CONVERT(VARCHAR(8), created_at, 108) = '23:59:00' THEN 1 ELSE 0 END) AS cnt_endday
       FROM [Kunjungan]
       WHERE kunjungan_id LIKE 'DD000000-%' AND koreksi_dari_id IS NULL AND status <> 'BATAL'`
    );
    expect(Number(boundaryCheck.recordset[0]?.cnt_midnight ?? 0)).toBeGreaterThanOrEqual(1);
    expect(Number(boundaryCheck.recordset[0]?.cnt_endday ?? 0)).toBeGreaterThanOrEqual(1);

    const ringToday = await svc.ringkasan({ jenis_periode: 'HARIAN', dari: todayIso, sampai: todayIso });
    const kjToday = (ringToday['kunjungan'] as { total_kunjungan: number }).total_kunjungan;
    expect(kjToday).toBeGreaterThanOrEqual(8);
  });
});
