import { RequestHandler } from 'express';
import ApiError from '../errors/ApiError';

interface Bucket {
  count: number;
  resetAt: number;
}

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyPrefix?: string;
}

// ponytail: limiter in-memory per proses; pindah ke Redis bila backend di-scale >1 instance
const buckets = new Map<string, Bucket>();
const sweeper = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}, 60_000);
sweeper.unref();

export const resetRateLimit = (): void => {
  buckets.clear();
};

export const createRateLimiter = ({ windowMs, max, keyPrefix = 'global' }: RateLimitOptions): RequestHandler => {
  return (req, res, next) => {
    const key = `${keyPrefix}:${req.ip ?? 'unknown'}`;
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      res.setHeader('X-RateLimit-Limit', String(max));
      res.setHeader('X-RateLimit-Remaining', String(max - 1));
      return next();
    }

    bucket.count += 1;
    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - bucket.count)));

    if (bucket.count > max) {
      res.setHeader('Retry-After', String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))));
      return next(ApiError.tooManyRequests('Terlalu banyak permintaan, coba lagi nanti'));
    }
    return next();
  };
};

export default { createRateLimiter, resetRateLimit };
