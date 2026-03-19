export function verifyAdminCode(submitted: string, envCode: string): boolean {
  return Boolean(submitted && envCode && submitted === envCode);
}
