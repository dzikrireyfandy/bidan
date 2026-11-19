import { z } from 'zod';
import ApiError from '../errors/ApiError';

export const parseInput = <S extends z.ZodType>(schema: S, value: unknown, label: string): z.infer<S> => {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw ApiError.badRequest(`Validasi ${label} gagal`, result.error.issues);
  }
  return result.data;
};

export const parseBody = <S extends z.ZodType>(schema: S, body: unknown): z.infer<S> =>
  parseInput(schema, body, 'body');

export const parseQuery = <S extends z.ZodType>(schema: S, query: unknown): z.infer<S> =>
  parseInput(schema, query, 'query');

export const parseParams = <S extends z.ZodType>(schema: S, params: unknown): z.infer<S> =>
  parseInput(schema, params, 'params');

export const paginate = (value: unknown, fallback: number, max: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(Math.trunc(parsed), max);
};

export const idParams = z.object({ id: z.string().uuid() });

export default { parseBody, parseQuery, parseParams, parseInput, paginate, idParams };
