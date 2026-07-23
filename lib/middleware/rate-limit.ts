import { NextResponse } from 'next/server';
import { getRedis } from '@/lib/config/redis';
import { config } from '@/lib/config/env';

export type RateLimitWindow = 'minute' | 'hour';

export interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
  windowLabel?: RateLimitWindow;
  message?: string;
  skipKey?: string;
}

interface MemoryBucket {
  count: number;
  resetAt: number;
}

const memoryBuckets = new Map<string, MemoryBucket>();

function getClientIdentifier(req: Request) {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

function getRateLimitKey(options: RateLimitOptions, req: Request) {
  const suffix = options.key.replace(/[^a-zA-Z0-9:_-]/g, '_');
  return `${suffix}:${getClientIdentifier(req)}`;
}

function getWindowMs(options: RateLimitOptions) {
  return options.windowMs || 60_000;
}

async function checkRedisLimit(options: RateLimitOptions, req: Request) {
  const key = `rl:${getRateLimitKey(options, req)}`;
  const windowMs = getWindowMs(options);
  const now = Date.now();
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const current = await getRedis().get(key);
  if (!current) {
    await getRedis().set(key, '1', 'PX', windowMs);
    return { allowed: true, remaining: options.limit - 1, resetAt: windowStart + windowMs };
  }

  const count = Number(current);
  if (count >= options.limit) {
    return { allowed: false, remaining: 0, resetAt: windowStart + windowMs };
  }

  await getRedis().incr(key);
  return { allowed: true, remaining: options.limit - count - 1, resetAt: windowStart + windowMs };
}

function checkMemoryLimit(options: RateLimitOptions, req: Request) {
  const key = getRateLimitKey(options, req);
  const now = Date.now();
  const windowMs = getWindowMs(options);
  const existing = memoryBuckets.get(key);

  if (!existing || now >= existing.resetAt) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: options.limit - 1, resetAt: now + windowMs };
  }

  if (existing.count >= options.limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { allowed: true, remaining: options.limit - existing.count, resetAt: existing.resetAt };
}

export async function rateLimit(options: RateLimitOptions, req: Request) {
  if (options.skipKey && process.env[options.skipKey]) {
    return { allowed: true, remaining: options.limit, resetAt: Date.now() + getWindowMs(options) };
  }

  try {
    if (config.REDIS_HOST && config.REDIS_HOST !== 'localhost') {
      const result = await checkRedisLimit(options, req);
      return result;
    }
  } catch (error) {
    console.warn('[rate-limit] Redis unavailable, falling back to memory store', error);
  }

  return checkMemoryLimit(options, req);
}

export async function enforceRateLimit(options: RateLimitOptions, req: Request) {
  const result = await rateLimit(options, req);
  if (!result.allowed) {
    return NextResponse.json(
      {
        error: options.message || 'Too many requests. Please try again later.',
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000))),
        },
      }
    );
  }

  return null;
}
