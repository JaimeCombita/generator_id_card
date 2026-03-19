import { verifyAdminCode } from '@/lib/domain/admin/adminService';

describe('verifyAdminCode', () => {
  it('returns true when submitted matches envCode', () => {
    expect(verifyAdminCode('secret123', 'secret123')).toBe(true);
  });

  it('returns false when submitted does not match envCode', () => {
    expect(verifyAdminCode('wrong', 'secret123')).toBe(false);
  });

  it('returns false when submitted is empty', () => {
    expect(verifyAdminCode('', 'secret123')).toBe(false);
  });

  it('returns false when envCode is empty (feature disabled)', () => {
    expect(verifyAdminCode('secret123', '')).toBe(false);
  });

  it('returns false when both are empty', () => {
    expect(verifyAdminCode('', '')).toBe(false);
  });

  it('is case-sensitive', () => {
    expect(verifyAdminCode('Secret123', 'secret123')).toBe(false);
    expect(verifyAdminCode('SECRET123', 'secret123')).toBe(false);
  });

  it('does not allow partial matches', () => {
    expect(verifyAdminCode('secret', 'secret123')).toBe(false);
    expect(verifyAdminCode('secret1234', 'secret123')).toBe(false);
  });
});
