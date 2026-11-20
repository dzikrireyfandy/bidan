import ApiError from '../errors/ApiError';
import { RequestHandler } from 'express';
import { ClientApp } from '../types';

const ALLOWED_APPS: ClientApp[] = ['BIDAN', 'RS', 'PORTAL'];

export const clientContext: RequestHandler = (req, _res, next) => {
  const clientAppHeader = req.headers['x-client-app'];

  if (!clientAppHeader || typeof clientAppHeader !== 'string') {
    req.clientApp = 'PORTAL';
    return next();
  }

  const upperApp = clientAppHeader.toUpperCase() as ClientApp;
  if (ALLOWED_APPS.includes(upperApp)) {
    req.clientApp = upperApp;
    return next();
  }

  if (process.env.NODE_ENV === 'production') {
    console.warn(`[WARN] Unsupported X-Client-App header received: ${clientAppHeader}`);
    req.clientApp = 'PORTAL';
    return next();
  } else {
    return next(ApiError.badRequest('X-Client-App tidak dikenali'));
  }
};

export default {
  clientContext
};
