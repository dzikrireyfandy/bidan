import { Request, Response, NextFunction, RequestHandler, ErrorRequestHandler } from 'express';
import ApiError from '../errors/ApiError';
import type { ApiFailure } from '../types';
import { ErrorCode } from '../errors/codes';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

interface ErrorLike {
  statusCode?: number;
  message?: string;
  details?: unknown;
  errorId?: ErrorCode | null;
  code?: string;
  name?: string;
}

const isErrorLike = (value: unknown): value is ErrorLike => typeof value === 'object' && value !== null;

const DB_ERROR_CODES = new Set(['ESOCKET', 'ECONNREFUSED', 'ETIMEOUT', 'ENOTOPEN', 'ELOGIN']);

const isDatabaseError = (err: ErrorLike): boolean =>
  (typeof err.code === 'string' && DB_ERROR_CODES.has(err.code)) ||
  err.name === 'ConnectionError' ||
  err.name === 'RequestError';

export const errorHandler: ErrorRequestHandler = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details: unknown = null;
  let errorId: ErrorCode | null = null;

  if (isErrorLike(err)) {
    if (typeof err.statusCode === 'number') {
      statusCode = err.statusCode;
    }
    if (typeof err.message === 'string') {
      message = err.message;
    }
    if (err.details !== undefined) {
      details = err.details;
    }
    if (err.errorId) {
      errorId = err.errorId;
    }

    if (statusCode === 500 && isDatabaseError(err) && !errorId) {
      statusCode = 503;
      message = 'Layanan tidak tersedia. Silakan coba lagi';
      errorId = 'ERR-SYS-01';
    }
  }

  if (statusCode >= 500 && process.env.NODE_ENV === 'production') {
    message = 'Internal Server Error';
    details = null;
  }

  if (statusCode >= 500 && req.id) {
    console.error(`[error] request=${req.id} status=${statusCode}`, err);
  }

  const body: ApiFailure = {
    success: false,
    error: {
      code: statusCode,
      errorId,
      message,
      details
    }
  };

  res.status(statusCode).json(body);
};

export default {
  notFoundHandler,
  errorHandler
};
