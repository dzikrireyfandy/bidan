export type Peran = 'SUPERADMIN' | 'ADMIN_LOKAL' | 'DOKTER' | 'STAFF' | 'PASIEN';

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

export interface Ruangan {
  ruangan_id: string;
  unit_id: string;
  gedung_id: string | null;
  kode: string;
  nama: string;
  jenis: string;
  lantai: number | null;
  kapasitas: number;
  status: string;
}

export interface LoginResponse {
  token: string;
  peran: Peran;
  subPeran: string | null;
}
