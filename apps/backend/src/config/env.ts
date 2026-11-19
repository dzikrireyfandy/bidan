import dotenv from 'dotenv';
dotenv.config();
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('3000').transform(val => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DB_SERVER: z.string().min(1, 'DB_SERVER is required'),
  DB_PORT: z.string().default('1433').transform(val => parseInt(val, 10)),
  DB_NAME: z.string().min(1, 'DB_NAME is required'),
  DB_USER: z.string().min(1, 'DB_USER is required'),
  DB_PASSWORD: z.string().min(1, 'DB_PASSWORD is required'),
  DB_ENCRYPT: z.string().default('false').transform(val => val === 'true'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional()
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('❌ Configuration validation error:', JSON.stringify(result.error.format(), null, 2));
  throw new Error('Invalid environment variables. Check .env configuration.');
}

export const config = Object.freeze(result.data);
export type Config = typeof config;
export default config;
