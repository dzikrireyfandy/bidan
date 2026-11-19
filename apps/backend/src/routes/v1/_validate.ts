import { z } from 'zod';
import ApiError from '../../errors/ApiError';

export const parseBody = <S extends z.ZodType>(schema: S, body: unknown): z.infer<S> => {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw ApiError.badRequest('Validasi gagal', result.error.issues);
  }
  return result.data;
};

export const parseQuery = parseBody;

export const paginate = (value: unknown, fallback: number, max: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(Math.trunc(parsed), max);
};

export default { parseBody, parseQuery, paginate };
