import jwt from 'jsonwebtoken';
import config from '../config/env';
import ApiError from '../errors/ApiError';
import { RequestHandler } from 'express';
import { Peran, SubPeran } from '../types';

const UNIT_SECONDS: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400, w: 604800 };

const toSeconds = (value: string): number => {
  if (/^\d+$/.test(value)) {
    return Number(value);
  }
  const match = /^(\d+)([smhdw])$/.exec(value.trim());
  if (!match || !match[1] || !match[2]) {
    return 86400;
  }
  return Number(match[1]) * (UNIT_SECONDS[match[2]] ?? 86400);
};

export function signToken({ akunId, peran, subPeran = null, stafId = null, pasienId = null }: {
  akunId: string;
  peran: Peran;
  subPeran?: SubPeran | null;
  stafId?: string | null;
  pasienId?: string | null;
}): string {
  const signOptions: jwt.SignOptions = { expiresIn: toSeconds(config.JWT_EXPIRES_IN) };
  return jwt.sign(
    {
      sub: akunId,
      peran,
      subPeran,
      stafId,
      pasienId
    },
    config.JWT_SECRET,
    signOptions
  );
}

export const authenticate: RequestHandler = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Token tidak ditemukan'));
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return next(ApiError.unauthorized('Token tidak ditemukan'));
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as jwt.JwtPayload & {
      sub: string;
      peran: Peran;
      subPeran?: SubPeran | null;
      stafId?: string | null;
      pasienId?: string | null;
    };
    req.auth = {
      akunId: decoded.sub,
      peran: decoded.peran,
      subPeran: decoded.subPeran || null,
      stafId: decoded.stafId || null,
      pasienId: decoded.pasienId || null
    };
    next();
  } catch (err) {
    return next(ApiError.unauthorized('Token tidak valid atau kedaluwarsa'));
  }
};

export default {
  signToken,
  authenticate
};
