import { RECORD_LIMITS } from '@/lib/infrastructure/config/constants';

export function normalizeIdentifier(value: unknown): string {
  return String(value ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
}

export function limitRecords<T>(records: T[], isAdmin: boolean): T[] {
  const limit = isAdmin ? RECORD_LIMITS.ABSOLUTE_MAX : RECORD_LIMITS.FREE_USER;
  return records.slice(0, limit);
}

export function shouldAddWatermark(isAdmin: boolean): boolean {
  return !isAdmin;
}
