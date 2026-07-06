import { getRedis } from "@/lib/config/redis";

const DEFAULT_TTL = 4_000;
const FALLBACK_TTL = 4_000;

const memoryCache = new Map<string, { data: unknown; expiry: number }>();

function memoryGet<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) { memoryCache.delete(key); return null; }
  return entry.data as T;
}

function memorySet<T>(key: string, data: T, ttl: number): void {
  memoryCache.set(key, { data, expiry: Date.now() + ttl });
  if (memoryCache.size > 500) {
    const firstKey = memoryCache.keys().next().value;
    if (firstKey) memoryCache.delete(firstKey);
  }
}

export async function cachedQuery<T>(
  key: string,
  ttl: number = DEFAULT_TTL,
  fetcher: () => Promise<T> | T
): Promise<T> {
  const memResult = memoryGet<T>(key);
  if (memResult !== null) return memResult;

  try {
    const redis = getRedis();
    const redisVal = await redis.get(key);
    if (redisVal) {
      const parsed = JSON.parse(redisVal) as T;
      memorySet(key, parsed, FALLBACK_TTL);
      return parsed;
    }
  } catch {}

  const data = await Promise.resolve(fetcher());

  try {
    const redis = getRedis();
    await redis.setex(key, Math.ceil(ttl / 1000), JSON.stringify(data));
  } catch {}
  memorySet(key, data, FALLBACK_TTL);

  return data;
}

export function invalidateCache(key: string): void {
  memoryCache.delete(key);
  try {
    const redis = getRedis();
    redis.del(key).catch(() => {});
  } catch {}
}

export function invalidateCachePattern(pattern: string): void {
  for (const key of memoryCache.keys()) {
    if (key.includes(pattern)) memoryCache.delete(key);
  }
  try {
    const redis = getRedis();
    const stream = redis.scanStream({ match: pattern, count: 100 });
    stream.on("data", (keys: string[]) => {
      if (keys.length) redis.del(keys).catch(() => {});
    });
    stream.resume();
  } catch {}
}

export async function withCache<T>(
  key: string,
  ttl: number,
  fetcher: () => T
): Promise<T> {
  return cachedQuery(key, ttl, fetcher);
}
