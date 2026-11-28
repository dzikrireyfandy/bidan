import { paginate } from '../validation/common';
import DashboardRepository, { type BarisStokMentah } from '../repositories/dashboard.repository';
import type { DashboardInternalInput } from '../validation/dashboard';
import type { Peran, SubPeran } from '../types';

export type StatusStok = 'AMAN' | 'MENIPIS' | 'MENDEKATI_KEDALUWARSA' | 'KEDALUWARSA';

export interface EvaluasiStokItem {
  status_utama: StatusStok;
  daftar_status: StatusStok[];
  is_peringatan: boolean;
}

export function formatIsoKeDdMmYyyy(iso: string | null | undefined): string | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/**
 * Fungsi murni (1 definisi tertulis untuk SQL, API, dan UI):
 * - MENIPIS: stok_aktif < stok_minimum (tepat stok_aktif === stok_minimum adalah AMAN).
 * - MENDEKATI_KEDALUWARSA: memiliki batch aktif (jumlah > 0) dengan hari_ini <= tgl_kedaluwarsa <= batas_3_bulan.
 * - KEDALUWARSA: memiliki batch (jumlah > 0) dengan tgl_kedaluwarsa < hari_ini.
 * - AMAN: selain ketiga kondisi di atas.
 * Daftar peringatan stok menampilkan item berstatus MENIPIS atau MENDEKATI_KEDALUWARSA.
 */
export function tentukanStatusStokItem(input: {
  stokAktif: number;
  stokMinimum: number;
  stokKedaluwarsa: number;
  tglExpAktifTerdekat: string | null;
  hariIniIso: string;
  batas3BulanIso: string;
}): EvaluasiStokItem {
  const isMenipis = Number(input.stokAktif) < Number(input.stokMinimum);
  const isMendekati =
    Boolean(input.tglExpAktifTerdekat) &&
    String(input.tglExpAktifTerdekat) >= input.hariIniIso &&
    String(input.tglExpAktifTerdekat) <= input.batas3BulanIso;
  const isKedaluwarsa = Number(input.stokKedaluwarsa) > 0;

  const daftar: StatusStok[] = [];
  if (isMenipis) daftar.push('MENIPIS');
  if (isMendekati) daftar.push('MENDEKATI_KEDALUWARSA');
  if (isKedaluwarsa) daftar.push('KEDALUWARSA');
  if (daftar.length === 0) daftar.push('AMAN');

  const statusUtama: StatusStok = isMenipis
    ? 'MENIPIS'
    : isMendekati
      ? 'MENDEKATI_KEDALUWARSA'
      : isKedaluwarsa
        ? 'KEDALUWARSA'
        : 'AMAN';

  return {
    status_utama: statusUtama,
    daftar_status: daftar,
    is_peringatan: isMenipis || isMendekati
  };
}

export class DashboardService {
  constructor(private readonly repository: DashboardRepository = new DashboardRepository()) {}

  async getInternalDashboard(
    body: DashboardInternalInput,
    auth: { peran: Peran; subPeran: SubPeran | null }
  ): Promise<Record<string, unknown>> {
    const isAdmin =
      auth.peran === 'ADMIN_LOKAL' ||
      auth.peran === 'SUPERADMIN' ||
      (auth.peran === 'STAFF' && auth.subPeran === 'RESEPSIONIS');

    const limitPeringatan = paginate(body.limit_peringatan, 50, 200);
    const limitTagihan = paginate(body.limit_tagihan, 50, 200);

    const [refTgl, kunjunganHariIni, barisStok, tagihanAdmin] = await Promise.all([
      this.repository.getReferensiTanggalWib(),
      this.repository.getRingkasanKunjunganHariIni(),
      this.repository.getAgregatStokObat(),
      isAdmin ? this.repository.getTagihanBelumLunasAdmin(limitTagihan) : Promise.resolve(null)
    ]);

    let countAman = 0;
    let countMenipis = 0;
    let countMendekati = 0;
    let countKedaluwarsa = 0;

    const evaluatedItems = barisStok.map((row: BarisStokMentah) => {
      const stokAktif = Number(row.stok_aktif ?? 0);
      const stokMin = Number(row.stok_minimum ?? 0);
      const stokExp = Number(row.stok_kedaluwarsa ?? 0);
      const evalStok = tentukanStatusStokItem({
        stokAktif,
        stokMinimum: stokMin,
        stokKedaluwarsa: stokExp,
        tglExpAktifTerdekat: row.tgl_exp_aktif_terdekat,
        hariIniIso: refTgl.hari_ini,
        batas3BulanIso: refTgl.batas_3_bulan
      });

      if (evalStok.status_utama === 'AMAN') countAman++;
      if (evalStok.daftar_status.includes('MENIPIS')) countMenipis++;
      if (evalStok.daftar_status.includes('MENDEKATI_KEDALUWARSA')) countMendekati++;
      if (evalStok.daftar_status.includes('KEDALUWARSA')) countKedaluwarsa++;

      return {
        obat_id: row.obat_id,
        kode: row.kode,
        nama_generik: row.nama_generik,
        nama_dagang: row.nama_dagang,
        kategori: row.kategori,
        satuan: row.satuan,
        stok_aktif: stokAktif,
        stok_minimum: stokMin,
        stok_kedaluwarsa: stokExp,
        tgl_exp_terdekat: row.tgl_exp_aktif_terdekat,
        tgl_exp_terdekat_tampil: formatIsoKeDdMmYyyy(row.tgl_exp_aktif_terdekat),
        status_stok: evalStok.status_utama,
        daftar_status: evalStok.daftar_status,
        is_peringatan: evalStok.is_peringatan
      };
    });

    const peringatanStok = evaluatedItems
      .filter((it) => it.is_peringatan)
      .sort((a, b) => {
        const prioA = a.daftar_status.includes('MENIPIS') ? 0 : 1;
        const prioB = b.daftar_status.includes('MENIPIS') ? 0 : 1;
        if (prioA !== prioB) return prioA - prioB;
        return a.stok_aktif - b.stok_aktif;
      })
      .slice(0, limitPeringatan);

    return {
      tanggal_hari_ini: refTgl.hari_ini,
      tanggal_tampil: formatIsoKeDdMmYyyy(refTgl.hari_ini),
      batas_kedaluwarsa_3_bulan: refTgl.batas_3_bulan,
      kunjungan_hari_ini: kunjunganHariIni,
      ringkasan_stok: {
        total_item: evaluatedItems.length,
        aman: countAman,
        menipis: countMenipis,
        mendekati_kedaluwarsa: countMendekati,
        kedaluwarsa: countKedaluwarsa
      },
      peringatan_stok: peringatanStok,
      // Daftar tagihan belum lunas HANYA dikirim untuk Admin (null untuk Bidan!)
      tagihan_belum_lunas: tagihanAdmin
        ? {
            ...tagihanAdmin,
            items: tagihanAdmin.items.map((it) => ({
              ...it,
              tgl_terbit_tampil: formatIsoKeDdMmYyyy(String(it['tgl_terbit'] ?? ''))
            }))
          }
        : null
    };
  }
}

export default DashboardService;
