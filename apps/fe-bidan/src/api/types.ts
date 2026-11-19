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

export interface LoginResponse {
  token: string;
  peran: Peran;
  subPeran: string | null;
}

export interface KontenPublik {
  konten_id: string;
  tipe: string;
  judul: string;
  isi: string;
  media_url: string;
  urutan: number;
  updated_at: string;
}
