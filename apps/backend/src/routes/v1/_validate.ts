import { RequestHandler } from 'express';
import { z } from 'zod';
import { parseInput, paginate, parseBody, parseQuery, parseParams } from '../../validation/common';
import type { RouteSchemas } from './_registry';

export const validate = (schemas: RouteSchemas): RequestHandler => {
  return (req, _res, next) => {
    try {
      req.validated = {
        body: schemas.body ? parseInput(schemas.body, req.body ?? {}, 'body') : undefined,
        query: schemas.query ? parseInput(schemas.query, req.query ?? {}, 'query') : undefined,
        params: schemas.params ? parseInput(schemas.params, req.params ?? {}, 'params') : undefined
      };
      next();
    } catch (err) {
      next(err);
    }
  };
};

export { parseBody, parseQuery, parseParams, paginate };
export type { RouteSchemas };
export default validate;
