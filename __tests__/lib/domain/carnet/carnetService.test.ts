import {
  normalizeIdentifier,
  limitRecords,
  shouldAddWatermark,
} from '@/lib/domain/carnet/carnetService';

describe('normalizeIdentifier', () => {
  it('lowercases input', () => {
    expect(normalizeIdentifier('ABC123')).toBe('abc123');
  });

  it('removes accents/diacritics', () => {
    expect(normalizeIdentifier('José')).toBe('jose');
    expect(normalizeIdentifier('Ángela')).toBe('angela');
    expect(normalizeIdentifier('González')).toBe('gonzalez');
  });

  it('removes spaces and special characters', () => {
    expect(normalizeIdentifier('123 456')).toBe('123456');
    expect(normalizeIdentifier('abc-def')).toBe('abcdef');
    expect(normalizeIdentifier('abc.def')).toBe('abcdef');
  });

  it('strips leading/trailing whitespace before processing', () => {
    expect(normalizeIdentifier('  123  ')).toBe('123');
  });

  it('returns empty string for null/undefined', () => {
    expect(normalizeIdentifier(null)).toBe('');
    expect(normalizeIdentifier(undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(normalizeIdentifier('')).toBe('');
  });

  it('handles numeric values', () => {
    expect(normalizeIdentifier(1001234567)).toBe('1001234567');
  });
});

describe('limitRecords', () => {
  const tenRecords = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 }));
  const thousandRecords = Array.from({ length: 1000 }, (_, i) => ({ id: i + 1 }));

  it('limits non-admin users to 5 records', () => {
    expect(limitRecords(tenRecords, false)).toHaveLength(5);
  });

  it('allows admin users up to 1000 records', () => {
    expect(limitRecords(thousandRecords, true)).toHaveLength(1000);
  });

  it('does not truncate if records are within free-user limit', () => {
    const threeRecords = [{ id: 1 }, { id: 2 }, { id: 3 }];
    expect(limitRecords(threeRecords, false)).toHaveLength(3);
  });

  it('returns the first N records in order', () => {
    const result = limitRecords(tenRecords, false);
    expect(result[0]).toEqual({ id: 1 });
    expect(result[4]).toEqual({ id: 5 });
  });

  it('does not mutate the original array', () => {
    const original = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }];
    limitRecords(original, false);
    expect(original).toHaveLength(6);
  });

  it('handles empty array', () => {
    expect(limitRecords([], false)).toEqual([]);
    expect(limitRecords([], true)).toEqual([]);
  });
});

describe('shouldAddWatermark', () => {
  it('returns true for non-admin (free user)', () => {
    expect(shouldAddWatermark(false)).toBe(true);
  });

  it('returns false for admin (no watermark)', () => {
    expect(shouldAddWatermark(true)).toBe(false);
  });
});
