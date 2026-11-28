import { randomUUID } from 'node:crypto';
import type sql from 'mssql';
import KlinisRepository from '../src/repositories/klinis.repository';
import db from '../src/db/pool';

describe('Fase 1 — Alur Tulis RME Atomik, FEFO, Red-Flag Alergi, & Koreksi Append-Only', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('membatalkan seluruh transaksi (rollback penuh) bila stok obat FEFO tidak mencukupi (ERR-INV-01)', async () => {
    let rolledBack = false;
    const executedQueries: string[] = [];

    jest.spyOn(db, 'transaction').mockImplementation(async <T>(fn: (tx: sql.Transaction) => Promise<T>): Promise<T> => {
      try {
        return await fn({} as sql.Transaction);
      } catch (err) {
        rolledBack = true;
        throw err;
      }
    });

    jest.spyOn(db, 'queryInTx').mockImplementation(async (_tx, text) => {
      executedQueries.push(text);
      if (text.includes('FROM [Pasien]')) {
        return { recordset: [{ pasien_id: '11111111-1111-1111-1111-111111111111' }], rowsAffected: [1] } as never;
      }
      if (text.includes('FROM [Alergi_Kondisi]')) {
        return { recordset: [], rowsAffected: [0] } as never;
      }
      if (text.includes('FROM [Obat]') && text.includes('SELECT TOP 1')) {
        return {
          recordset: [
            {
              obat_id: '22222222-2222-2222-2222-222222222222',
              nama_generik: 'Asam Folat',
              nama_dagang: 'Folavit',
              golongan: 'SUPLEMEN'
            }
          ],
          rowsAffected: [1]
        } as never;
      }
      if (text.includes('FROM [Staf]')) {
        return { recordset: [{ staf_id: '33333333-3333-3333-3333-333333333333' }], rowsAffected: [1] } as never;
      }
      if (text.includes('FROM [Unit_Pelayanan]')) {
        return { recordset: [{ unit_id: '44444444-4444-4444-4444-444444444444' }], rowsAffected: [1] } as never;
      }
      if (text.includes('FROM [Penjamin]')) {
        return { recordset: [{ penjamin_id: '55555555-5555-5555-5555-555555555555' }], rowsAffected: [1] } as never;
      }
      if (text.includes('FROM [Reservasi]') && text.includes('SELECT TOP 1')) {
        return { recordset: [], rowsAffected: [0] } as never;
      }
      if (text.includes('today_iso')) {
        return { recordset: [{ today_iso: '2026-11-28' }], rowsAffected: [1] } as never;
      }
      if (text.includes('FROM [Kunjungan] k') && text.includes('NOT IN')) {
        return { recordset: [], rowsAffected: [0] } as never;
      }
      if (text.includes('FROM [Diagnosa]')) {
        return {
          recordset: [
            {
              diagnosa_id: '66666666-6666-6666-6666-666666666666',
              kode_icd: 'Z34.8',
              nama: 'Pengawasan Kehamilan Normal Rutin (ANC Terpadu)'
            }
          ],
          rowsAffected: [1]
        } as never;
      }
      if (text.includes('FROM [Layanan_Medis]')) {
        return { recordset: [{ layanan_id: '77777777-7777-7777-7777-777777777777' }], rowsAffected: [1] } as never;
      }
      if (text.includes('FROM [Stok_Batch] sb WITH (UPDLOCK, ROWLOCK)')) {
        // Stok aktif hanya 3, padahal diminta 10 -> wajib gagal ERR-INV-01 & rollback!
        return {
          recordset: [{ batch_id: '88888888-8888-8888-8888-888888888888', gudang_id: '99999999-9999-9999-9999-999999999999', jumlah: 3 }],
          rowsAffected: [1]
        } as never;
      }
      return { recordset: [], rowsAffected: [1] } as never;
    });

    const repo = new KlinisRepository();
    await expect(
      repo.simpanRme({
        pasien_id: '11111111-1111-1111-1111-111111111111',
        keluhan: 'Kontrol kehamilan trimester 2',
        kode_icd10: 'Z34.8',
        diagnosa: 'Pengawasan Kehamilan Normal Rutin (ANC Terpadu)',
        resep_obat: [{ obat_id: '22222222-2222-2222-2222-222222222222', qty: 10 }],
        stafId: '33333333-3333-3333-3333-333333333333'
      })
    ).rejects.toMatchObject({
      statusCode: 422,
      errorId: 'ERR-INV-01'
    });

    expect(rolledBack).toBe(true);
    // Tagihan belum sempat dibuat karena rollback terjadi saat cek stok
    expect(executedQueries.some((q) => q.includes('INSERT INTO [Tagihan]'))).toBe(false);
  });

  test('menolak simpan resep bila obat cocok dengan Alergi_Kondisi aktif pasien tanpa override (ERR-RME-01 & ERR-RME-02)', async () => {
    const pasienId = randomUUID().toUpperCase();
    const obatId = randomUUID().toUpperCase();

    jest.spyOn(db, 'transaction').mockImplementation(async <T>(fn: (tx: sql.Transaction) => Promise<T>): Promise<T> =>
      fn({} as sql.Transaction)
    );

    jest.spyOn(db, 'queryInTx').mockImplementation(async (_tx, text) => {
      if (text.includes('FROM [Pasien]')) {
        return { recordset: [{ pasien_id: pasienId }], rowsAffected: [1] } as never;
      }
      if (text.includes('FROM [Alergi_Kondisi]')) {
        return {
          recordset: [{ obat_id: obatId, nama: 'Amoksisilin / Penisilin', kategori: 'ALERGI_OBAT' }],
          rowsAffected: [1]
        } as never;
      }
      if (text.includes('FROM [Obat]')) {
        return {
          recordset: [
            { obat_id: obatId, nama_generik: 'Amoksisilin', nama_dagang: 'Amoxsan', golongan: 'KERAS' }
          ],
          rowsAffected: [1]
        } as never;
      }
      return { recordset: [], rowsAffected: [0] } as never;
    });

    const repo = new KlinisRepository();

    // 1. Tanpa override -> ERR-RME-01
    await expect(
      repo.simpanRme({
        pasien_id: pasienId,
        keluhan: 'Nyeri luka perineum',
        resep_obat: [{ obat_id: obatId, qty: 1 }],
        stafId: randomUUID().toUpperCase()
      })
    ).rejects.toMatchObject({
      statusCode: 409,
      errorId: 'ERR-RME-01'
    });

    // 2. override_alergi = true tetapi alasan kosong -> ERR-RME-02
    await expect(
      repo.simpanRme({
        pasien_id: pasienId,
        keluhan: 'Nyeri luka perineum',
        override_alergi: true,
        alasan_override: '',
        resep_obat: [{ obat_id: obatId, qty: 1 }],
        stafId: randomUUID().toUpperCase()
      })
    ).rejects.toMatchObject({
      statusCode: 409,
      errorId: 'ERR-RME-02'
    });
  });

  test('memotong stok secara FEFO lintas beberapa batch, mencatat Kunjungan_Diagnosa, Mutasi_Stok, dan Tagihan atomik', async () => {
    const pasienId = randomUUID().toUpperCase();
    const obatId = randomUUID().toUpperCase();
    const batchNear = randomUUID().toUpperCase();
    const batchFar = randomUUID().toUpperCase();
    const gudangId = randomUUID().toUpperCase();
    const tagihanId = randomUUID().toUpperCase();

    const deductedBatches: Array<{ batchId: string; ambil: number }> = [];
    const mutasiRecorded: Array<{ batchId: string; negAmbil: number }> = [];
    let diagnosaLinked = false;

    jest.spyOn(db, 'transaction').mockImplementation(async <T>(fn: (tx: sql.Transaction) => Promise<T>): Promise<T> =>
      fn({} as sql.Transaction)
    );

    jest.spyOn(db, 'queryInTx').mockImplementation(async (_tx, text, params = {}) => {
      if (text.includes('FROM [Pasien]')) return { recordset: [{ pasien_id: pasienId }], rowsAffected: [1] } as never;
      if (text.includes('FROM [Alergi_Kondisi]')) return { recordset: [], rowsAffected: [0] } as never;
      if (text.includes('FROM [Obat]') && text.includes('SELECT TOP 1')) {
        return {
          recordset: [{ obat_id: obatId, nama_generik: 'Tablet Tambah Darah', nama_dagang: 'Sangobion', golongan: 'SUPLEMEN' }],
          rowsAffected: [1]
        } as never;
      }
      if (text.includes('FROM [Staf]')) return { recordset: [{ staf_id: randomUUID().toUpperCase() }], rowsAffected: [1] } as never;
      if (text.includes('FROM [Unit_Pelayanan]')) return { recordset: [{ unit_id: randomUUID().toUpperCase() }], rowsAffected: [1] } as never;
      if (text.includes('FROM [Penjamin]')) return { recordset: [{ penjamin_id: randomUUID().toUpperCase() }], rowsAffected: [1] } as never;
      if (text.includes('FROM [Reservasi]') && text.includes('SELECT TOP 1')) return { recordset: [], rowsAffected: [0] } as never;
      if (text.includes('today_iso')) return { recordset: [{ today_iso: '2026-11-28' }], rowsAffected: [1] } as never;
      if (text.includes('FROM [Kunjungan] k') && text.includes('NOT IN')) return { recordset: [], rowsAffected: [0] } as never;
      if (text.includes('FROM [Diagnosa]')) {
        return {
          recordset: [{ diagnosa_id: randomUUID().toUpperCase(), kode_icd: 'D50.9', nama: 'Anemia Defisiensi Besi pada Ibu Hamil' }],
          rowsAffected: [1]
        } as never;
      }
      if (text.includes('INSERT INTO [Kunjungan_Diagnosa]')) {
        diagnosaLinked = true;
        return { recordset: [], rowsAffected: [1] } as never;
      }
      if (text.includes('FROM [Layanan_Medis]')) {
        return { recordset: [{ layanan_id: randomUUID().toUpperCase() }], rowsAffected: [1] } as never;
      }
      if (text.includes('FROM [Stok_Batch] sb WITH (UPDLOCK, ROWLOCK)')) {
        // Batch terdekat punya 4 pcs, batch kedua punya 10 pcs; diminta 7 pcs -> harus ambil 4 dari batchNear lalu 3 dari batchFar!
        return {
          recordset: [
            { batch_id: batchNear, gudang_id: gudangId, jumlah: 4 },
            { batch_id: batchFar, gudang_id: gudangId, jumlah: 10 }
          ],
          rowsAffected: [2]
        } as never;
      }
      if (text.includes('UPDATE [Stok_Batch]') && text.includes('jumlah = jumlah - @ambil')) {
        deductedBatches.push({ batchId: String(params.bid), ambil: Number(params.ambil) });
        return { recordset: [], rowsAffected: [1] } as never;
      }
      if (text.includes('INSERT INTO [Mutasi_Stok]')) {
        mutasiRecorded.push({ batchId: String(params.bid), negAmbil: Number(params.negAmbil) });
        return { recordset: [], rowsAffected: [1] } as never;
      }
      if (text.includes('FROM [Tagihan]')) {
        return { recordset: [{ tagihan_id: tagihanId, status: 'BELUM_LUNAS', total_dibayar: 0 }], rowsAffected: [1] } as never;
      }
      if (text.includes('FROM [Harga_Layanan]')) return { recordset: [{ harga: 75000 }], rowsAffected: [1] } as never;
      if (text.includes('FROM [Harga_Obat]')) return { recordset: [{ harga_jual: 15000 }], rowsAffected: [1] } as never;
      if (text.includes('SELECT CAST(ISNULL(SUM(subtotal), 0)')) return { recordset: [{ total: 180000 }], rowsAffected: [1] } as never;

      return { recordset: [], rowsAffected: [1] } as never;
    });

    const repo = new KlinisRepository();
    const res = await repo.simpanRme({
      pasien_id: pasienId,
      keluhan: 'Pusing dan lemas saat hamil 24 minggu',
      kode_icd10: 'D50.9',
      diagnosa: 'Anemia Defisiensi Besi pada Ibu Hamil',
      resep_obat: [{ obat_id: obatId, qty: 7 }],
      stafId: randomUUID().toUpperCase()
    });

    expect(diagnosaLinked).toBe(true);
    expect(deductedBatches).toEqual([
      { batchId: batchNear, ambil: 4 },
      { batchId: batchFar, ambil: 3 }
    ]);
    expect(mutasiRecorded).toEqual([
      { batchId: batchNear, negAmbil: -4 },
      { batchId: batchFar, negAmbil: -3 }
    ]);
    expect(res.kode_icd).toBe('D50.9');
    expect(res.tagihan_id).toBe(tagihanId);
  });
});
