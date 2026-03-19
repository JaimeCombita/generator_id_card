import { escapeHtml } from '@/lib/infrastructure/security/htmlEscaper';

describe('escapeHtml', () => {
  it('returns empty string for null/undefined', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });

  it('escapes ampersand', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('escapes < and >', () => {
    expect(escapeHtml('<div>')).toBe('&lt;div&gt;');
  });

  it('escapes double quotes', () => {
    expect(escapeHtml('"quote"')).toBe('&quot;quote&quot;');
  });

  it('escapes single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#39;s');
  });

  it('escapes all special characters together', () => {
    expect(escapeHtml('<script>alert("xss&\'test\'");</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&amp;&#39;test&#39;&quot;);&lt;/script&gt;',
    );
  });

  it('returns plain string unchanged when no special chars', () => {
    expect(escapeHtml('Hello World 123')).toBe('Hello World 123');
  });

  it('converts non-string values to string first', () => {
    expect(escapeHtml(42)).toBe('42');
    expect(escapeHtml(true)).toBe('true');
  });
});
