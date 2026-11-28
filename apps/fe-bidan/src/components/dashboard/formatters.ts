/**
 * Utilitas pemformatan konsisten Bahasa Indonesia (Rupiah, DD/MM/YYYY, & Zona Waktu Asia/Jakarta)
 */

export function formatRupiahUI(nominal: number | string | null | undefined): string {
  const num = Number(nominal ?? 0);
  if (!Number.isFinite(num)) return 'Rp 0';
  const rounded = Math.round((num + Number.EPSILON) * 100) / 100;
  const hasDecimals = Math.abs(rounded % 1) > 0.001;
  const formatted = Math.abs(rounded).toLocaleString('id-ID', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2
  });
  if (rounded < 0) return `-Rp ${formatted}`;
  return `Rp ${formatted}`;
}

export function formatTanggalUI(value: string | null | undefined): string {
  if (!value) return '-';
  const clean = String(value).trim().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    const [y, m, d] = clean.split('-');
    return `${d}/${m}/${y}`;
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
    return clean;
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(parsed);
  }
  return String(value);
}

export function getHariIniWibIso(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === 'year')?.value ?? '2026';
  const m = parts.find((p) => p.type === 'month')?.value ?? '01';
  const d = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${y}-${m}-${d}`;
}

export function getRentangBulanWib(yearMonth?: string): { dari: string; sampai: string; ym: string } {
  const todayIso = getHariIniWibIso();
  const ym = yearMonth && /^\d{4}-\d{2}$/.test(yearMonth) ? yearMonth : todayIso.slice(0, 7);
  const [yStr, mStr] = ym.split('-');
  const y = Number(yStr);
  const m = Number(mStr);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return {
    ym,
    dari: `${ym}-01`,
    sampai: `${ym}-${String(lastDay).padStart(2, '0')}`
  };
}

export function hitungHariInklusifUI(dariIso: string, sampaiIso: string): number {
  const [dy = 0, dm = 1, dd = 1] = dariIso.split('-').map(Number);
  const [sy = 0, sm = 1, sd = 1] = sampaiIso.split('-').map(Number);
  const start = Date.UTC(dy, dm - 1, dd);
  const end = Date.UTC(sy, sm - 1, sd);
  return Math.round((end - start) / 86_400_000) + 1;
}

export function geserTanggalIso(baseIso: string, deltaDays: number): string {
  const [y = 2026, m = 1, d = 1] = baseIso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + deltaDays)).toISOString().slice(0, 10);
}

export function hitungPeriodePembandingSebanding(dariUtama: string, sampaiUtama: string): {
  pembanding_dari: string;
  pembanding_sampai: string;
  panjang_hari: number;
} {
  const panjang = Math.max(1, hitungHariInklusifUI(dariUtama, sampaiUtama));
  const pembandingSampai = geserTanggalIso(dariUtama, -1);
  const pembandingDari = geserTanggalIso(pembandingSampai, -(panjang - 1));
  return {
    pembanding_dari: pembandingDari,
    pembanding_sampai: pembandingSampai,
    panjang_hari: panjang
  };
}

export function validasiRentangTanggalUI(dari: string, sampai: string): string | null {
  if (!dari || !sampai) {
    return 'Tanggal awal dan tanggal akhir wajib diisi.';
  }
  if (dari > sampai) {
    return 'Tanggal awal tidak boleh lebih besar dari tanggal akhir.';
  }
  const hari = hitungHariInklusifUI(dari, sampai);
  if (hari > 366) {
    return `Rentang tanggal maksimal 366 hari (saat ini ${hari} hari).`;
  }
  return null;
}
