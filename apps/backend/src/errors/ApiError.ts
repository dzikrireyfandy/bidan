export class ApiError extends Error {
  statusCode: number;
  details: unknown;

  constructor(statusCode: number, message: string, details: unknown = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details: unknown = null): ApiError {
    return new ApiError(400, message, details);
  }

  static unauthorized(message: string = 'Unauthorized', details: unknown = null): ApiError {
    return new ApiError(401, message, details);
  }

  static forbidden(message: string = 'Forbidden', details: unknown = null): ApiError {
    return new ApiError(403, message, details);
  }

  static notFound(message: string = 'Not Found', details: unknown = null): ApiError {
    return new ApiError(404, message, details);
  }

  static conflict(message: string, details: unknown = null): ApiError {
    return new ApiError(409, message, details);
  }

  static internal(message: string = 'Internal Server Error', details: unknown = null): ApiError {
    return new ApiError(500, message, details);
  }
}

export default ApiError;
