import { Request, Response, NextFunction, RequestHandler, ErrorRequestHandler } from 'express';
import ApiError from '../errors/ApiError';
import type { ApiFailure } from '../types';

export const notFoundHandler: RequestHandler = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

interface ErrorLike { statusCode?: number; message?: string; details?: unknown; }
const isErrorLike = (value: unknown): value is ErrorLike => typeof value === 'object' && value !== null;

export const errorHandler: ErrorRequestHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details: unknown = null;

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
  }

  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = 'Internal Server Error';
    details = null;
  }

  const body: ApiFailure = {
    success: false,
    error: {
      code: statusCode,
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
