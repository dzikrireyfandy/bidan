import { ErrorCode, errorIdFor } from './codes';

export class ApiError extends Error {
  statusCode: number;
  details: unknown;
  errorId: ErrorCode | null;

  constructor(statusCode: number, message: string, details: unknown = null, errorId: ErrorCode | null = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.errorId = errorId;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  static fromCode(code: ErrorCode, details: unknown = null, message?: string): ApiError {
    const mapped = errorIdFor(code);
    return new ApiError(mapped.status, message ?? mapped.message, details, code);
  }

  static badRequest(message: string, details: unknown = null): ApiError {
    return new ApiError(400, message, details);
  }

  static validation(message: string = 'Validasi gagal', details: unknown = null): ApiError {
    return ApiError.fromCode('ERR-VAL-01', details, message);
  }

  static unauthorized(message: string = 'Unauthorized', details: unknown = null, code: ErrorCode = 'ERR-AUTH-01'): ApiError {
    return ApiError.fromCode(code, details, message);
  }

  static forbidden(message: string = 'Forbidden', details: unknown = null): ApiError {
    return ApiError.fromCode('ERR-AUTH-03', details, message);
  }

  static notFound(message: string = 'Not Found', details: unknown = null): ApiError {
    return new ApiError(404, message, details);
  }

  static conflict(message: string, details: unknown = null, code: ErrorCode | null = null): ApiError {
    return new ApiError(409, message, details, code);
  }

  static tooManyRequests(message: string = 'Terlalu banyak permintaan, coba lagi nanti', details: unknown = null): ApiError {
    return ApiError.fromCode('ERR-SYS-03', details, message);
  }

  static badGateway(message: string = 'Layanan pesan tidak dapat dihubungi', details: unknown = null): ApiError {
    return ApiError.fromCode('ERR-NTF-01', details, message);
  }

  static serviceUnavailable(message: string = 'Layanan tidak tersedia. Silakan coba lagi', details: unknown = null): ApiError {
    return ApiError.fromCode('ERR-SYS-01', details, message);
  }

  static internal(message: string = 'Internal Server Error', details: unknown = null): ApiError {
    return new ApiError(500, message, details);
  }
}

export default ApiError;
