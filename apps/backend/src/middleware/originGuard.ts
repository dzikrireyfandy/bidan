import { RequestHandler } from 'express';
import config from '../config/env';
import ApiError from '../errors/ApiError';

const allowedOrigins = new Set(config.ALLOWED_ORIGINS);

export const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return true;
  return allowedOrigins.has(origin);
};

export const originGuard: RequestHandler = (req, _res, next) => {
  const origin = req.headers.origin;
  if (typeof origin === 'string' && !isOriginAllowed(origin)) {
    return next(ApiError.forbidden(`Origin ${origin} tidak diizinkan`));
  }
  next();
};

export default { originGuard, isOriginAllowed };
