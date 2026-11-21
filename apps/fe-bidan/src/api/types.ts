export type Peran = 'SUPERADMIN' | 'ADMIN_LOKAL' | 'DOKTER' | 'STAFF' | 'PASIEN';
export type SubPeran = 'PERAWAT' | 'RESEPSIONIS' | null;

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: number;
    message: string;
    details: unknown;
  };
}

export interface LoginResponse {
  token: string;
  peran: Peran;
  subPeran: SubPeran;
  user?: {
    id: string;
    nama: string;
    role: string;
  };
}

export interface KontenPublik {
  konten_id: string;
  tipe: 'PROFIL' | 'LAYANAN' | 'KONTAK' | 'GALERI' | 'TESTIMONI';
  judul: string;
  isi: string;
  media_url: string;
  urutan: number;
  updated_at: string;
}

export interface LayananItem {
  layanan_id: string;
  nama: string;
  kategori: 'ANC' | 'PERSALINAN' | 'NIFAS' | 'KB' | 'NEWBORN' | 'LAKTASI';
  deskripsi: string;
  durasi_menit: number;
  highlight: string;
  icon: string;
  cakupan: string[];
}

export interface SesiPraktikItem {
  sesi_id: string;
  nama: string;
  jam_mulai: string;
  jam_selesai: string;
  kuota_maks: number;
  durasi_per_pasien: number;
  terisi: number;
  sisa_kuota: number;
  status: 'BUKA' | 'PENUH' | 'SELESAI';
  keterangan: string;
}

export interface AntreanItem {
  antrean_id: string;
  nomor_antrean: string;
  status: 'MENUNGGU' | 'DIPERIKSA' | 'SELESAI' | 'BATAL';
  waktu_estimasi: string;
  nama_samaran: string;
  nama_layanan: string;
}

export interface ReservasiData {
  nama: string;
  nik: string;
  no_hp: string;
  email: string;
  tanggal: string;
  sesi_id: string;
  layanan_id: string;
  keluhan: string;
  is_pasien_lama: boolean;
}


export interface HargaObatLogItem {
  harga_obat_id: string;
  obat_id: string;
  kode_obat: string;
  nama_obat: string;
  kategori: string;
  hpp_beli: number;
  harga_jual: number;
  margin_rp: number;
  margin_persen: number;
  berlaku_dari: string;
  berlaku_sampai: string | null;
  diubah_oleh: string;
  alasan: string;
}

export interface RekapKeuanganOperasional {
  periode: string;
  total_pendapatan: number;
  total_pengeluaran_obat: number;
  beban_operasional_klinik: number;
  laba_bersih: number;
  margin_bersih_persen: number;
  analisis_fluktuasi: string;
}

export interface NotifikasiEmailPasien {
  notif_id: string;
  pasien_nama: string;
  email_tujuan: string;
  jenis: 'TIKET_RESERVASI' | 'PENGINGAT_KONTROL_H1' | 'RESUME_MEDIS_KIA';
  subjek: string;
  waktu_kirim: string;
  status: 'TERKIRIM' | 'MENUNGGU' | 'GAGAL';
}
