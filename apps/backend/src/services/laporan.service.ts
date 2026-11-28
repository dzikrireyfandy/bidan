import ExcelJS from 'exceljs';
import { buildPdfReportBuffer, type PdfLine } from '../utils/pdfReportBuilder';
import ApiError from '../errors/ApiError';
import config from '../config/env';
import { flushQueue } from '../jobs/cron';
import { hitungPanjangHariInklusif, paginate, periodRange } from '../validation/common';
import LaporanRepository, { type AgregatItemPeriode } from '../repositories/laporan.repository';
import type { KontenBody, KontenUpdateBody, PeriodeInput } from '../validation/laporan';

const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

export const formatRupiah = (nominal: number): string => {
  const n = round2(Number(nominal || 0));
  const absFormatted = Math.abs(n).toLocaleString('id-ID', {
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  });
  return n < 0 ? `-Rp ${absFormatted}` : `Rp ${absFormatted}`;
};

export const formatTanggalId = (iso: string | null | undefined): string => {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '-';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

export interface HasilEfekItem {
  tipe_item: string;
  item_id: string;
  kode_item: string;
  nama_item: string;
  qty_lama: number;
  harga_lama: number;
  pendapatan_lama: number;
  qty_baru: number;
  harga_baru: number;
  pendapatan_baru: number;
  efek_volume: number;
  efek_harga: number;
  selisih_pendapatan: number;
  hanya_satu_periode: boolean;
}

export interface HasilAnalisisEfekHarga {
  ringkasan: {
    total_pendapatan_lama: number;
    total_pendapatan_baru: number;
    total_selisih: number;
    total_efek_volume: number;
    total_efek_harga: number;
  };
  items: HasilEfekItem[];
}

/**
 * Rumus Efek Volume & Efek Harga per Item (Bebas pembagian nol, rekonsiliasi selisih = 0):
 * - Bila item ada di kedua periode (qty_lama > 0 DAN qty_baru > 0):
 *     efek_volume = (qty_baru - qty_lama) * harga_lama
 *     efek_harga  = (harga_baru - harga_lama) * qty_baru
 *     efek_volume + efek_harga === selisih_pendapatan
 * - Bila item hanya ada di satu periode (qty_lama = 0 ATAU qty_baru = 0):
 *     seluruh selisih = efek_volume; efek_harga = 0.
 */
export function hitungEfekVolumeDanHarga(
  utamaItems: AgregatItemPeriode[],
  pembandingItems: AgregatItemPeriode[]
): HasilAnalisisEfekHarga {
  const mapBaru = new Map<string, AgregatItemPeriode>();
  const mapLama = new Map<string, AgregatItemPeriode>();

  for (const it of utamaItems) {
    mapBaru.set(`${it.tipe_item}:${it.item_id}`, it);
  }
  for (const it of pembandingItems) {
    mapLama.set(`${it.tipe_item}:${it.item_id}`, it);
  }

  const allKeys = [...new Set([...mapBaru.keys(), ...mapLama.keys()])];
  const hasilItems: HasilEfekItem[] = [];

  let sumLama = 0;
  let sumBaru = 0;
  let sumVol = 0;
  let sumHrg = 0;

  for (const key of allKeys) {
    const b = mapBaru.get(key);
    const l = mapLama.get(key);
    const meta = b ?? l!;

    const q0 = round2(Number(l?.qty ?? 0));
    const r0 = round2(Number(l?.pendapatan ?? 0));
    const q1 = round2(Number(b?.qty ?? 0));
    const r1 = round2(Number(b?.pendapatan ?? 0));
    const selisih = round2(r1 - r0);

    let p0Display = 0;
    let p1Display = 0;
    let efekVolume = 0;
    let efekHarga = 0;
    let satuPeriode = false;

    if (q0 <= 0 || q1 <= 0) {
      // Item hanya ada di satu periode -> seluruh selisih masuk efek_volume, tidak ada pembagian nol!
      p0Display = q0 > 0 ? round2(r0 / q0) : 0;
      p1Display = q1 > 0 ? round2(r1 / q1) : 0;
      efekVolume = selisih;
      efekHarga = 0;
      satuPeriode = true;
    } else {
      const p0Exact = r0 / q0;
      const p1Exact = r1 / q1;
      p0Display = round2(p0Exact);
      p1Display = round2(p1Exact);
      // Hitung efek_volume dari harga lama eksak, dan selaraskan efek_harga = selisih - efek_volume
      // agar efek_volume + efek_harga === selisih_pendapatan tanpa residu pembulatan!
      efekVolume = round2((q1 - q0) * p0Exact);
      efekHarga = round2(selisih - efekVolume);
    }

    sumLama = round2(sumLama + r0);
    sumBaru = round2(sumBaru + r1);
    sumVol = round2(sumVol + efekVolume);
    sumHrg = round2(sumHrg + efekHarga);

    hasilItems.push({
      tipe_item: meta.tipe_item,
      item_id: meta.item_id,
      kode_item: meta.kode_item,
      nama_item: meta.nama_item,
      qty_lama: q0,
      harga_lama: p0Display,
      pendapatan_lama: r0,
      qty_baru: q1,
      harga_baru: p1Display,
      pendapatan_baru: r1,
      efek_volume: efekVolume,
      efek_harga: efekHarga,
      selisih_pendapatan: selisih,
      hanya_satu_periode: satuPeriode
    });
  }

  hasilItems.sort((a, b) => Math.abs(b.selisih_pendapatan) - Math.abs(a.selisih_pendapatan));

  return {
    ringkasan: {
      total_pendapatan_lama: sumLama,
      total_pendapatan_baru: sumBaru,
      total_selisih: round2(sumBaru - sumLama),
      total_efek_volume: sumVol,
      total_efek_harga: sumHrg
    },
    items: hasilItems
  };
}

const periodeOf = (body: PeriodeInput): { dari: string | null; sampai: string | null } => {
  periodRange(body);
  return { dari: body.dari ?? null, sampai: body.sampai ?? null };
};

export interface BerkasEkspor {
  format: 'PDF' | 'EXCEL';
  mimeType: string;
  filename: string;
  buffer: Buffer;
}

export class LaporanService {
  constructor(private readonly repository: LaporanRepository = new LaporanRepository()) {}

  async #resolvePeriodeLengkap(body: PeriodeInput): Promise<{
    dari: string | null;
    sampai: string | null;
    jenisPeriode: 'HARIAN' | 'BULANAN';
  }> {
    periodRange(body);
    const jenisPeriode: 'HARIAN' | 'BULANAN' = body.jenis_periode ?? 'BULANAN';
    if (!body.dari && !body.sampai && typeof this.repository.getBatasBulanBerjalanWib === 'function') {
      const def = await this.repository.getBatasBulanBerjalanWib();
      return { dari: def.dari, sampai: def.sampai, jenisPeriode };
    }
    return { dari: body.dari ?? null, sampai: body.sampai ?? null, jenisPeriode };
  }

  async ringkasan(body: PeriodeInput): Promise<Record<string, unknown>> {
    // Pertahankan kompatibilitas mock unit test lama yang belum punya method tambahan
    const hasExtendedRepo = typeof this.repository.seriKunjunganDanPendapatan === 'function';
    const resolved = hasExtendedRepo
      ? await this.#resolvePeriodeLengkap(body)
      : { ...periodeOf(body), jenisPeriode: (body.jenis_periode ?? 'BULANAN') as 'HARIAN' | 'BULANAN' };

    const periode = { dari: resolved.dari, sampai: resolved.sampai };
    const [kunjungan, pendapatan, rawatInap] = await Promise.all([
      this.repository.ringkasanKunjungan(periode),
      this.repository.ringkasanPendapatan(periode),
      this.repository.ringkasanRawatInap(periode)
    ]);

    const totalKunjungan = Number(kunjungan['total_kunjungan'] ?? 0);
    const totalPendapatan = Number(pendapatan['total_pendapatan'] ?? 0);
    const episode = Number(rawatInap['episode_rawat_inap'] ?? 0);
    if (totalKunjungan === 0 && totalPendapatan === 0 && episode === 0) {
      throw ApiError.fromCode('ERR-RPT-01');
    }

    if (!hasExtendedRepo) {
      return { kunjungan, pendapatan, rawat_inap: rawatInap };
    }

    const [seri, trenDiagnosis, trenLayananMedis] = await Promise.all([
      this.repository.seriKunjunganDanPendapatan(periode, resolved.jenisPeriode),
      this.repository.trenLayanan(paginate(body.limit, 10, 50), periode),
      this.repository.trenTindakanMedis(paginate(body.limit, 10, 50), periode)
    ]);

    return {
      periode: {
        jenis_periode: resolved.jenisPeriode,
        dari: resolved.dari,
        sampai: resolved.sampai,
        dari_tampil: formatTanggalId(resolved.dari),
        sampai_tampil: formatTanggalId(resolved.sampai)
      },
      kunjungan: {
        ...kunjungan,
        total_kunjungan: totalKunjungan,
        rawat_jalan: Number(kunjungan['rawat_jalan'] ?? 0),
        rawat_inap: Number(kunjungan['rawat_inap'] ?? 0)
      },
      pendapatan: {
        ...pendapatan,
        total_pendapatan: totalPendapatan,
        jumlah_tagihan_lunas: Number(pendapatan['jumlah_tagihan_lunas'] ?? 0)
      },
      rawat_inap: rawatInap,
      seri_periode: seri,
      tren_diagnosis: trenDiagnosis,
      tren_layanan: trenLayananMedis
    };
  }

  async trenLayanan(body: PeriodeInput): Promise<Record<string, unknown>[] | Record<string, unknown>> {
    const periode = periodeOf(body);
    const limit = paginate(body.limit, 10, 200);
    const diagnosis = await this.repository.trenLayanan(limit, periode);
    return diagnosis;
  }

  jamTersibuk(): Promise<Record<string, unknown>[]> {
    return this.repository.jamTersibuk();
  }

  async perbandingan(body: PeriodeInput): Promise<Record<string, unknown>[] | Record<string, unknown>> {
    const periodeUtama = periodeOf(body);

    if (body.pembanding_dari || body.pembanding_sampai) {
      if (!body.dari || !body.sampai || !body.pembanding_dari || !body.pembanding_sampai) {
        throw ApiError.validation('Validasi periode pembanding gagal', [
          {
            path: ['pembanding_dari'],
            message: 'Tanggal awal dan akhir untuk periode utama serta periode pembanding wajib diisi lengkap'
          }
        ]);
      }

      periodRange({ dari: body.pembanding_dari, sampai: body.pembanding_sampai });

      const lenUtama = hitungPanjangHariInklusif(body.dari, body.sampai);
      const lenPembanding = hitungPanjangHariInklusif(body.pembanding_dari, body.pembanding_sampai);
      if (lenUtama !== lenPembanding) {
        throw ApiError.validation('Validasi periode pembanding gagal', [
          {
            path: ['pembanding_sampai'],
            message: `Panjang periode pembanding (${lenPembanding} hari) harus sama dengan periode utama (${lenUtama} hari)`
          }
        ]);
      }

      const [utamaItems, pembandingItems] = await Promise.all([
        this.repository.agregasiItemPeriode({ dari: body.dari, sampai: body.sampai }),
        this.repository.agregasiItemPeriode({ dari: body.pembanding_dari, sampai: body.pembanding_sampai })
      ]);

      const hasilEfek = hitungEfekVolumeDanHarga(utamaItems, pembandingItems);
      return {
        periode_utama: {
          dari: body.dari,
          sampai: body.sampai,
          dari_tampil: formatTanggalId(body.dari),
          sampai_tampil: formatTanggalId(body.sampai),
          panjang_hari: lenUtama
        },
        periode_pembanding: {
          dari: body.pembanding_dari,
          sampai: body.pembanding_sampai,
          dari_tampil: formatTanggalId(body.pembanding_dari),
          sampai_tampil: formatTanggalId(body.pembanding_sampai),
          panjang_hari: lenPembanding
        },
        ...hasilEfek
      };
    }

    return this.repository.perbandingan(periodeUtama);
  }

  async export(body: PeriodeInput): Promise<{ format: string; rows: Record<string, unknown>[] }> {
    const rows = await this.repository.export(periodeOf(body));
    return { format: 'JSON', rows };
  }

  /**
   * Menghasilkan berkas biner PDF atau Excel dengan angka yang 100% identik dengan tampilan layar.
   * Bila pembuatan berkas gagal -> 500 "Gagal membuat berkas. Silakan coba lagi."
   */
  async generateExportFile(body: PeriodeInput): Promise<BerkasEkspor> {
    const format = body.format === 'EXCEL' ? 'EXCEL' : 'PDF';
    const dataRingkasan = await this.ringkasan(body);
    const jamSibuk = await this.jamTersibuk();
    let dataPerbandingan: Record<string, unknown> | null = null;
    if (body.pembanding_dari && body.pembanding_sampai) {
      dataPerbandingan = (await this.perbandingan(body)) as Record<string, unknown>;
    }

    try {
      const pInfo = (dataRingkasan['periode'] ?? {}) as Record<string, string>;
      const kjInfo = (dataRingkasan['kunjungan'] ?? {}) as Record<string, number>;
      const pdInfo = (dataRingkasan['pendapatan'] ?? {}) as Record<string, number>;
      const seri = (dataRingkasan['seri_periode'] ?? []) as Array<{
        label: string;
        jumlah_kunjungan: number;
        total_pendapatan: number;
      }>;
      const trenDiag = (dataRingkasan['tren_diagnosis'] ?? []) as Array<{
        kode_icd: string;
        nama: string;
        jumlah: number;
      }>;
      const trenLay = (dataRingkasan['tren_layanan'] ?? []) as Array<{
        kode: string;
        nama: string;
        kategori: string;
        jumlah: number;
      }>;
      const jamRows = jamSibuk as Array<{ jam: number; label_jam: string; jumlah: number }>;

      const fileDateSuffix = `${pInfo.dari ?? 'periode'}_sd_${pInfo.sampai ?? 'akhir'}`;

      if (format === 'EXCEL') {
        const wb = new ExcelJS.Workbook();
        wb.creator = 'Sistem Digitalisasi PMB Ria Indrasti';
        wb.created = new Date();

        const ws1 = wb.addWorksheet('Ringkasan & Tren');
        ws1.addRow(['LAPORAN OPERASIONAL & ANALISIS EFEK HARGA — PRAKTIK MANDIRI BIDAN']);
        ws1.addRow([
          `Periode Utama (${pInfo.jenis_periode ?? 'BULANAN'}): ${pInfo.dari_tampil ?? '-'} s/d ${pInfo.sampai_tampil ?? '-'}`
        ]);
        ws1.addRow([]);
        ws1.addRow(['Metrik Utama', 'Nilai']);
        ws1.addRow(['Total Kunjungan Valid', Number(kjInfo.total_kunjungan ?? 0)]);
        ws1.addRow(['Total Pendapatan (Transaksi Lunas)', formatRupiah(Number(pdInfo.total_pendapatan ?? 0))]);
        ws1.addRow(['Jumlah Berkas Tagihan Lunas', Number(pdInfo.jumlah_tagihan_lunas ?? 0)]);
        ws1.addRow([]);

        ws1.addRow(['RINCIAN KUNJUNGAN & PENDAPATAN PER PERIODE']);
        ws1.addRow(['Periode', 'Jumlah Kunjungan', 'Pendapatan (Rp)', 'Format Rupiah']);
        for (const s of seri) {
          ws1.addRow([s.label, s.jumlah_kunjungan, s.total_pendapatan, formatRupiah(s.total_pendapatan)]);
        }
        ws1.addRow([]);

        ws1.addRow(['TREN DIAGNOSIS TERBANYAK']);
        ws1.addRow(['Kode ICD-10', 'Nama Diagnosis', 'Jumlah Kasus']);
        for (const d of trenDiag) {
          ws1.addRow([d.kode_icd, d.nama, d.jumlah]);
        }
        ws1.addRow([]);

        ws1.addRow(['TREN JENIS LAYANAN MEDIS TERBANYAK']);
        ws1.addRow(['Kode Layanan', 'Nama Layanan', 'Kategori', 'Jumlah Tindakan']);
        for (const l of trenLay) {
          ws1.addRow([l.kode, l.nama, l.kategori, l.jumlah]);
        }

        const ws2 = wb.addWorksheet('Jam Tersibuk (30 Hari)');
        ws2.addRow(['DISTRIBUSI JAM KUNJUNGAN TERSIBUK (30 HARI TERAKHIR WIB)']);
        ws2.addRow(['Jam (WIB)', 'Jumlah Kunjungan']);
        for (const j of jamRows) {
          ws2.addRow([`${j.label_jam} WIB`, j.jumlah]);
        }

        if (dataPerbandingan) {
          const ws3 = wb.addWorksheet('Analisis Efek Harga');
          const ringEfek = (dataPerbandingan['ringkasan'] ?? {}) as Record<string, number>;
          const pLama = (dataPerbandingan['periode_pembanding'] ?? {}) as Record<string, string>;
          const efekItems = (dataPerbandingan['items'] ?? []) as HasilEfekItem[];

          ws3.addRow(['ANALISIS EFEK VOLUME & EFEK HARGA PER ITEM']);
          ws3.addRow([
            `Periode Utama: ${pInfo.dari_tampil} - ${pInfo.sampai_tampil} | Periode Pembanding: ${pLama.dari_tampil} - ${pLama.sampai_tampil}`
          ]);
          ws3.addRow([]);
          ws3.addRow(['Total Pendapatan Periode Pembanding', ringEfek.total_pendapatan_lama ?? 0, formatRupiah(ringEfek.total_pendapatan_lama ?? 0)]);
          ws3.addRow(['Total Pendapatan Periode Utama', ringEfek.total_pendapatan_baru ?? 0, formatRupiah(ringEfek.total_pendapatan_baru ?? 0)]);
          ws3.addRow(['Total Efek Volume', ringEfek.total_efek_volume ?? 0, formatRupiah(ringEfek.total_efek_volume ?? 0)]);
          ws3.addRow(['Total Efek Harga', ringEfek.total_efek_harga ?? 0, formatRupiah(ringEfek.total_efek_harga ?? 0)]);
          ws3.addRow(['Total Selisih Pendapatan', ringEfek.total_selisih ?? 0, formatRupiah(ringEfek.total_selisih ?? 0)]);
          ws3.addRow([]);
          ws3.addRow([
            'Tipe',
            'Kode',
            'Nama Item',
            'Qty Pembanding',
            'Harga Pembanding',
            'Pendapatan Pembanding',
            'Qty Utama',
            'Harga Utama',
            'Pendapatan Utama',
            'Efek Volume',
            'Efek Harga',
            'Selisih Pendapatan'
          ]);
          for (const it of efekItems) {
            ws3.addRow([
              it.tipe_item,
              it.kode_item,
              it.nama_item,
              it.qty_lama,
              it.harga_lama,
              it.pendapatan_lama,
              it.qty_baru,
              it.harga_baru,
              it.pendapatan_baru,
              it.efek_volume,
              it.efek_harga,
              it.selisih_pendapatan
            ]);
          }
        }

        const rawBuf = await wb.xlsx.writeBuffer();
        return {
          format: 'EXCEL',
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          filename: `Laporan-Operasional-PMB_${fileDateSuffix}.xlsx`,
          buffer: Buffer.from(rawBuf)
        };
      }

      // Pembuatan berkas PDF multi-halaman dengan angka identik tampilan layar
      const pdfLines: PdfLine[] = [
        { text: 'LAPORAN OPERASIONAL & ANALISIS EFEK HARGA', bold: true, size: 14, spaceAfter: 2 },
        { text: 'Praktik Mandiri Bidan Ria Indrasti J., S.Keb', size: 10, spaceAfter: 2 },
        {
          text: `Periode Utama (${pInfo.jenis_periode ?? 'BULANAN'}): ${pInfo.dari_tampil ?? '-'} s/d ${pInfo.sampai_tampil ?? '-'}`,
          size: 9.5,
          spaceAfter: 10
        },
        { text: '1. Ringkasan Kunjungan & Pendapatan', bold: true, size: 11, spaceAfter: 3 },
        { text: `- Total Kunjungan Valid: ${Number(kjInfo.total_kunjungan ?? 0)} kunjungan`, indent: 8 },
        { text: `- Total Pendapatan (Transaksi Lunas): ${formatRupiah(Number(pdInfo.total_pendapatan ?? 0))}`, indent: 8 },
        { text: `- Jumlah Berkas Tagihan Lunas: ${Number(pdInfo.jumlah_tagihan_lunas ?? 0)} tagihan`, indent: 8, spaceAfter: 8 },
        { text: '2. Rincian Kunjungan & Pendapatan per Periode', bold: true, size: 11, spaceAfter: 3 }
      ];

      for (const s of seri) {
        pdfLines.push({
          text: `${s.label} | ${s.jumlah_kunjungan} kunjungan | ${formatRupiah(s.total_pendapatan)}`,
          indent: 8,
          size: 9
        });
      }
      pdfLines.push({ text: '', spaceAfter: 6 });

      pdfLines.push({ text: '3. Tren Diagnosis Terbanyak', bold: true, size: 11, spaceAfter: 3 });
      for (const d of trenDiag) {
        pdfLines.push({
          text: `[${d.kode_icd}] ${d.nama}: ${d.jumlah} kunjungan`,
          indent: 8,
          size: 9
        });
      }
      pdfLines.push({ text: '', spaceAfter: 6 });

      pdfLines.push({ text: '4. Tren Jenis Layanan Medis Terbanyak', bold: true, size: 11, spaceAfter: 3 });
      for (const l of trenLay) {
        pdfLines.push({
          text: `[${l.kode}] ${l.nama} (${l.kategori}): ${l.jumlah} tindakan`,
          indent: 8,
          size: 9
        });
      }
      pdfLines.push({ text: '', spaceAfter: 6 });

      pdfLines.push({ text: '5. Jam Kunjungan Tersibuk (30 Hari Terakhir WIB)', bold: true, size: 11, spaceAfter: 3 });
      const activeJam = jamRows.filter((j) => j.jumlah > 0);
      if (activeJam.length === 0) {
        pdfLines.push({ text: 'Belum ada data kunjungan dalam 30 hari terakhir.', indent: 8, size: 9 });
      } else {
        for (const j of activeJam) {
          pdfLines.push({ text: `Pukul ${j.label_jam} WIB: ${j.jumlah} kunjungan`, indent: 8, size: 9 });
        }
      }

      if (dataPerbandingan) {
        const ringEfek = (dataPerbandingan['ringkasan'] ?? {}) as Record<string, number>;
        const pLama = (dataPerbandingan['periode_pembanding'] ?? {}) as Record<string, string>;
        const efekItems = (dataPerbandingan['items'] ?? []) as HasilEfekItem[];

        pdfLines.push({ text: '', spaceAfter: 8 });
        pdfLines.push({ text: '6. Analisis Efek Volume & Efek Harga per Item', bold: true, size: 11, spaceAfter: 3 });
        pdfLines.push({
          text: `Periode Pembanding: ${pLama.dari_tampil ?? '-'} s/d ${pLama.sampai_tampil ?? '-'}`,
          indent: 8,
          size: 9
        });
        pdfLines.push({
          text: `- Pendapatan Pembanding: ${formatRupiah(ringEfek.total_pendapatan_lama ?? 0)}`,
          indent: 8,
          size: 9
        });
        pdfLines.push({
          text: `- Pendapatan Utama: ${formatRupiah(ringEfek.total_pendapatan_baru ?? 0)}`,
          indent: 8,
          size: 9
        });
        pdfLines.push({
          text: `- Total Efek Volume: ${formatRupiah(ringEfek.total_efek_volume ?? 0)}`,
          indent: 8,
          size: 9
        });
        pdfLines.push({
          text: `- Total Efek Harga: ${formatRupiah(ringEfek.total_efek_harga ?? 0)}`,
          indent: 8,
          size: 9
        });
        pdfLines.push({
          text: `- Total Selisih Pendapatan: ${formatRupiah(ringEfek.total_selisih ?? 0)}`,
          indent: 8,
          bold: true,
          size: 9.5,
          spaceAfter: 4
        });

        for (const it of efekItems) {
          pdfLines.push({
            text: `[${it.kode_item}] ${it.nama_item} | Qty ${it.qty_lama}->${it.qty_baru} | Efek Vol: ${formatRupiah(it.efek_volume)} | Efek Harga: ${formatRupiah(it.efek_harga)} | Selisih: ${formatRupiah(it.selisih_pendapatan)}`,
            indent: 8,
            size: 8.5
          });
        }
      }

      const pdfBuffer = buildPdfReportBuffer(pdfLines);

      return {
        format: 'PDF',
        mimeType: 'application/pdf',
        filename: `Laporan-Operasional-PMB_${fileDateSuffix}.pdf`,
        buffer: pdfBuffer
      };
    } catch (err) {
      if (err instanceof ApiError) {
        throw err;
      }
      throw ApiError.fromCode('ERR-SYS-02', null, 'Gagal membuat berkas. Silakan coba lagi.');
    }
  }

  listKonten(body: PeriodeInput): Promise<Record<string, unknown>[]> {
    return this.repository.listKonten(paginate(body.limit, 100, 200));
  }

  async createKonten(body: KontenBody): Promise<Record<string, unknown>> {
    const row = await this.repository.createKonten(body);
    if (!row) {
      throw ApiError.internal('Gagal menyimpan konten');
    }
    return row;
  }

  async updateKonten(id: string, body: KontenUpdateBody): Promise<Record<string, unknown>> {
    if (Object.keys(body).length === 0) {
      throw ApiError.validation('Tidak ada perubahan');
    }
    const row = await this.repository.updateKonten(id, body as Record<string, unknown>);
    if (!row) {
      throw ApiError.fromCode('ERR-CNT-01');
    }
    return row;
  }

  async deleteKonten(id: string): Promise<Record<string, unknown>> {
    const row = await this.repository.softDeleteKonten(id);
    if (!row) {
      throw ApiError.fromCode('ERR-CNT-01');
    }
    return row;
  }

  listNotifikasi(body: PeriodeInput): Promise<Record<string, unknown>[]> {
    return this.repository.listNotifikasi(paginate(body.limit, 100, 200));
  }

  async kirimUlangNotifikasi(id: string): Promise<Record<string, unknown>> {
    const row = await this.repository.kirimUlangNotifikasi(id);
    if (!row) {
      throw ApiError.notFound('Log notifikasi tidak ditemukan');
    }
    if (config.NODE_ENV !== 'test') {
      void flushQueue();
    }
    return row;
  }

  listAudit(body: PeriodeInput): Promise<Record<string, unknown>[]> {
    return this.repository.listAudit(paginate(body.limit, 10000, 50000), periodeOf(body));
  }
}

export default LaporanService;
