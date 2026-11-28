import ApiError from '../errors/ApiError';
import { Request, RequestHandler } from 'express';
import { Peran, Profile, SubPeran } from '../types';
import { auditRepository } from '../repositories/audit.repository';

export const PERAN = {
  SUPERADMIN: 'SUPERADMIN',
  ADMIN_LOKAL: 'ADMIN_LOKAL',
  DOKTER: 'DOKTER',
  STAFF: 'STAFF',
  PASIEN: 'PASIEN'
} as const satisfies Record<string, Peran>;

export const SUB_PERAN = {
  PERAWAT: 'PERAWAT',
  RESEPSIONIS: 'RESEPSIONIS'
} as const satisfies Record<string, SubPeran>;

export const effectiveProfile = (auth: { peran: Peran; subPeran: SubPeran | null }): Profile =>
  auth.peran === PERAN.STAFF && auth.subPeran ? `STAFF:${auth.subPeran}` : auth.peran;

export const requireRole = (...roles: Peran[]): RequestHandler => {
  return async (req, _res, next) => {
    if (!req.auth || !roles.includes(req.auth.peran)) {
      await auditRepository.logAccessDenied({
        akunId: req.auth?.akunId ?? null,
        peran: req.auth?.peran ?? 'UNKNOWN',
        method: req.method,
        path: req.originalUrl || req.path,
        ipAddress: req.ip
      });
      return next(ApiError.fromCode('ERR-AUTH-03'));
    }
    next();
  };
};

export const requireProfiles = (...allowedProfiles: Profile[]): RequestHandler => {
  return async (req, _res, next) => {
    if (!req.auth) {
      return next(ApiError.fromCode('ERR-AUTH-03'));
    }
    const profile = effectiveProfile(req.auth);
    // Profil parent (mis. ADMIN_LOKAL) tetap boleh bila didaftarkan eksplisit.
    if (!allowedProfiles.includes(profile) && !allowedProfiles.includes(req.auth.peran)) {
      await auditRepository.logAccessDenied({
        akunId: req.auth.akunId,
        peran: profile,
        method: req.method,
        path: req.originalUrl || req.path,
        ipAddress: req.ip
      });
      return next(ApiError.fromCode('ERR-AUTH-03'));
    }
    next();
  };
};

export const requireSubPeran = (...allowedSubPeran: SubPeran[]): RequestHandler => {
  return (req, _res, next) => {
    if (!req.auth || req.auth.peran !== PERAN.STAFF || !allowedSubPeran.includes(req.auth.subPeran as SubPeran)) {
      return next(ApiError.forbidden(`Akses ditolak untuk sub-peran staff`));
    }
    next();
  };
};

export const ADMIN_ROLES: Peran[] = [PERAN.SUPERADMIN, PERAN.ADMIN_LOKAL];

export const allowSelf = (getOwnerId: (req: Request) => string): RequestHandler => {
  return (req, _res, next) => {
    if (!req.auth) {
      return next(ApiError.forbidden('Akses ditolak'));
    }
    if (ADMIN_ROLES.includes(req.auth.peran)) {
      return next();
    }
    const ownerId = getOwnerId(req);
    if (req.auth.pasienId && req.auth.pasienId === ownerId) {
      return next();
    }
    return next(ApiError.forbidden('Akses ditolak: Anda hanya dapat mengakses data Anda sendiri'));
  };
};

export default {
  PERAN,
  SUB_PERAN,
  effectiveProfile,
  requireRole,
  requireProfiles,
  requireSubPeran,
  allowSelf
};
