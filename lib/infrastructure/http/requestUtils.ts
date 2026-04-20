import { NextRequest } from 'next/server';

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return 'unknown';
}

export function isOriginAllowed(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;

  const currentOrigin = request.nextUrl.origin;
  if (origin === currentOrigin) return true;

  const allowListRaw = process.env.ALLOWED_ORIGINS ?? '';
  const allowList = allowListRaw
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

  if (allowList.length === 0) return origin === currentOrigin;
  return allowList.includes(origin);
}
