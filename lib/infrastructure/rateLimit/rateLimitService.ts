import { RATE_LIMIT } from '../config/constants';

interface RedisConfig {
  redisUrl: string;
  redisToken: string;
}

const requestHits = new Map<string, number[]>();

function getRedisConfig(): RedisConfig | null {
  const redisUrl = (
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    ''
  ).trim();
  const redisToken = (
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    ''
  ).trim();

  if (!redisUrl || !redisToken) return null;
  return { redisUrl, redisToken };
}

function isRateLimitedInMemory(clientIp: string): boolean {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT.WINDOW_MS;
  const hits = requestHits.get(clientIp) ?? [];
  const freshHits = hits.filter((t) => t > cutoff);

  if (freshHits.length >= RATE_LIMIT.MAX_REQUESTS) {
    requestHits.set(clientIp, freshHits);
    return true;
  }

  freshHits.push(now);
  requestHits.set(clientIp, freshHits);
  return false;
}

export async function isRateLimited(clientIp: string): Promise<boolean> {
  const config = getRedisConfig();
  if (!config) return isRateLimitedInMemory(clientIp);

  const { redisUrl, redisToken } = config;
  const key = `rate:generate:${clientIp}`;
  const encodedKey = encodeURIComponent(key);

  try {
    const incrRes = await fetch(`${redisUrl}/incr/${encodedKey}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${redisToken}` },
      cache: 'no-store',
    });

    if (!incrRes.ok) return isRateLimitedInMemory(clientIp);

    const incrResult = await incrRes.json();
    const count = Number(incrResult?.result ?? 0);

    await fetch(`${redisUrl}/pexpire/${encodedKey}/${RATE_LIMIT.WINDOW_MS}/NX`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${redisToken}` },
      cache: 'no-store',
    });

    return count > RATE_LIMIT.MAX_REQUESTS;
  } catch {
    return isRateLimitedInMemory(clientIp);
  }
}
