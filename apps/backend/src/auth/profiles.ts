import type { Profile } from '../types';

/** Profil efektif sesuai TSD Bagian 1.2 dan 3.2. */
export const P = {
  SUPERADMIN: 'SUPERADMIN',
  ADMIN_LOKAL: 'ADMIN_LOKAL',
  DOKTER: 'DOKTER',
  PERAWAT: 'STAFF:PERAWAT',
  RESEPSIONIS: 'STAFF:RESEPSIONIS',
  PASIEN: 'PASIEN'
} as const satisfies Record<string, Profile>;

export const SEMUA_STAF: Profile[] = [
  P.SUPERADMIN,
  P.ADMIN_LOKAL,
  P.DOKTER,
  P.PERAWAT,
  P.RESEPSIONIS
];

export const ADMIN_LOKAL: Profile[] = [P.SUPERADMIN, P.ADMIN_LOKAL];

export const KLINIS: Profile[] = [P.SUPERADMIN, P.DOKTER, P.PERAWAT];

export const DOKTER: Profile[] = [P.SUPERADMIN, P.DOKTER];

export const KASIR: Profile[] = [P.SUPERADMIN, P.ADMIN_LOKAL, P.RESEPSIONIS];

export const PENDAFTARAN: Profile[] = [
  P.SUPERADMIN,
  P.ADMIN_LOKAL,
  P.DOKTER,
  P.PERAWAT,
  P.RESEPSIONIS
];

export const PIMPINAN: Profile[] = [P.SUPERADMIN, P.ADMIN_LOKAL, P.DOKTER];

export const SEMUA_AUTH: Profile[] = [
  P.SUPERADMIN,
  P.ADMIN_LOKAL,
  P.DOKTER,
  P.PERAWAT,
  P.RESEPSIONIS,
  P.PASIEN
];

export default P;
