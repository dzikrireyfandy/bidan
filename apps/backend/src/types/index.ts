export type Peran = 'SUPERADMIN' | 'ADMIN_LOKAL' | 'DOKTER' | 'STAFF' | 'PASIEN';

export type SubPeran = 'PERAWAT' | 'RESEPSIONIS';

export type ClientApp = 'BIDAN' | 'RS' | 'PORTAL';

export interface AuthContext {
  akunId: string;
  peran: Peran;
  subPeran: SubPeran | null;
  stafId: string | null;
  pasienId: string | null;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiFailure {
  success: false;
  error: {
    code: number;
    message: string;
    details: unknown;
  };
}

export interface Pasien {
  pasienId: string;
  noRm: string;
  nik: string;
  nama: string;
  jenisKelamin: string;
  tglLahir: Date;
  tempatLahir: string;
  alamat: string;
  noTelepon: string;
  golDarah: string | null;
  statusPernikahan: string | null;
  pekerjaan: string | null;
  ibuPasienId: string | null;
  email: string | null;
  createdAt: Date;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
      clientApp: ClientApp;
      id: string;
    }
  }
}
