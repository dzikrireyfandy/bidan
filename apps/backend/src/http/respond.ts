import { Response } from 'express';
import type { ApiSuccess } from '../types';

export const respond = {
  ok<T>(res: Response, data: T, meta: Record<string, unknown> | null = null): Response {
    const body: ApiSuccess<T> = meta ? { success: true, data, meta } : { success: true, data };
    return res.status(200).json(body);
  },
  created<T>(res: Response, data: T, meta: Record<string, unknown> | null = null): Response {
    const body: ApiSuccess<T> = meta ? { success: true, data, meta } : { success: true, data };
    return res.status(201).json(body);
  }
};

export default respond;
