import { NextRequest } from 'next/server';
import { getClientIp, isOriginAllowed } from '@/lib/infrastructure/http/requestUtils';

function makeRequest(headers: Record<string, string>, url = 'https://app-carnets.jcengine.co/api/generate') {
  return new NextRequest(url, { headers });
}

describe('getClientIp', () => {
  it('returns first IP from x-forwarded-for when multiple are present', () => {
    const req = makeRequest({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' });
    expect(getClientIp(req)).toBe('1.2.3.4');
  });

  it('returns single IP from x-forwarded-for', () => {
    const req = makeRequest({ 'x-forwarded-for': '9.9.9.9' });
    expect(getClientIp(req)).toBe('9.9.9.9');
  });

  it('falls back to x-real-ip when x-forwarded-for is absent', () => {
    const req = makeRequest({ 'x-real-ip': '10.0.0.1' });

    expect(getClientIp(req)).toBe('10.0.0.1');
  });

  it('returns "unknown" when no IP headers are present', () => {
    const req = makeRequest({});
    expect(getClientIp(req)).toBe('unknown');
  });

  it('trims whitespace from x-forwarded-for', () => {
    const req = makeRequest({ 'x-forwarded-for': '  1.2.3.4  , 5.6.7.8' });
    expect(getClientIp(req)).toBe('1.2.3.4');
  });
});

describe('isOriginAllowed', () => {
  const APP_URL = 'https://app-carnets.jcengine.co';

  afterEach(() => {
    delete process.env.ALLOWED_ORIGINS;
  });

  it('allows request with no origin header (server-to-server)', () => {
    const req = makeRequest({}, `${APP_URL}/api/generate`);
    expect(isOriginAllowed(req)).toBe(true);
  });

  it('allows request from same origin when ALLOWED_ORIGINS is not set', () => {
    const req = makeRequest({ origin: APP_URL }, `${APP_URL}/api/generate`);
    expect(isOriginAllowed(req)).toBe(true);
  });

  it('blocks request from different origin when ALLOWED_ORIGINS is not set', () => {
    const req = makeRequest({ origin: 'https://evil.com' }, `${APP_URL}/api/generate`);
    expect(isOriginAllowed(req)).toBe(false);
  });

  it('allows origin listed in ALLOWED_ORIGINS', () => {
    process.env.ALLOWED_ORIGINS = 'https://trusted.com,https://also-trusted.com';
    const req = makeRequest({ origin: 'https://trusted.com' }, `${APP_URL}/api/generate`);
    expect(isOriginAllowed(req)).toBe(true);
  });

  it('blocks origin NOT in ALLOWED_ORIGINS even if it matches site origin', () => {
    process.env.ALLOWED_ORIGINS = 'https://trusted.com';
    const req = makeRequest({ origin: APP_URL }, `${APP_URL}/api/generate`);
    expect(isOriginAllowed(req)).toBe(false);
  });

  it('blocks origin not in ALLOWED_ORIGINS list', () => {
    process.env.ALLOWED_ORIGINS = 'https://trusted.com';
    const req = makeRequest({ origin: 'https://evil.com' }, `${APP_URL}/api/generate`);
    expect(isOriginAllowed(req)).toBe(false);
  });

  it('handles ALLOWED_ORIGINS with whitespace around entries', () => {
    process.env.ALLOWED_ORIGINS = ' https://trusted.com , https://also-trusted.com ';
    const req = makeRequest({ origin: 'https://trusted.com' }, `${APP_URL}/api/generate`);
    expect(isOriginAllowed(req)).toBe(true);
  });
});
