import { Response } from 'express';
import type { ApiSuccess } from '../types';

export class BaseController<TService> {
  protected readonly service: TService;

  constructor(service: TService) {
    this.service = service;
  }

  ok<T>(res: Response, data: T, meta: Record<string, unknown> | null = null): Response {
    const body: ApiSuccess<T> = meta ? { success: true, data, meta } : { success: true, data };
    return res.status(200).json(body);
  }

  created<T>(res: Response, data: T, meta: Record<string, unknown> | null = null): Response {
    const body: ApiSuccess<T> = meta ? { success: true, data, meta } : { success: true, data };
    return res.status(201).json(body);
  }
}

export default BaseController;
