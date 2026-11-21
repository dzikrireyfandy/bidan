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
