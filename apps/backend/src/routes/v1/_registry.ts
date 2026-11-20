import { Router, RequestHandler } from 'express';
import { z } from 'zod';
import type { Profile } from '../../types';

export type RouteMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

export interface RouteSchemas {
  body?: z.ZodType;
  query?: z.ZodType;
  params?: z.ZodType;
}

export interface RouteMeta {
  method: RouteMethod;
  path: string;
  auth: boolean;
  profiles: readonly Profile[];
  schemas: RouteSchemas;
}

export const routeRegistry: RouteMeta[] = [];

export const defineRoute = (
  router: Router,
  meta: RouteMeta,
  ...handlers: RequestHandler[]
): void => {
  routeRegistry.push(meta);
  router[meta.method](meta.path, ...handlers);
};

export const getRouteRegistry = (): ReadonlyArray<RouteMeta> => routeRegistry;

export const resetRouteRegistry = (): void => {
  routeRegistry.length = 0;
};

export default { defineRoute, getRouteRegistry, resetRouteRegistry, routeRegistry };
