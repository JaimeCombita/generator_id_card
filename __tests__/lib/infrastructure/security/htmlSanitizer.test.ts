import { sanitizeTemplateHtml } from '@/lib/infrastructure/security/htmlSanitizer';

describe('sanitizeTemplateHtml', () => {
  describe('script removal', () => {
    it('removes inline <script> tags', () => {
      const input = '<div>Hello</div><script>alert("xss")</script>';
      expect(sanitizeTemplateHtml(input)).not.toContain('<script>');
      expect(sanitizeTemplateHtml(input)).toContain('<div>Hello</div>');
    });

    it('removes multiline <script> blocks', () => {
      const input = '<p>text</p><script>\nconsole.log("bad");\n</script>';
      expect(sanitizeTemplateHtml(input)).not.toContain('console.log');
    });

    it('removes <script> with attributes', () => {
      const input = '<script type="text/javascript" src="evil.js"></script>';
      expect(sanitizeTemplateHtml(input)).not.toContain('<script');
    });
  });

  describe('iframe/object/embed removal', () => {
    it('removes <iframe> tags', () => {
      const input = '<iframe src="https://evil.com"></iframe>';
      expect(sanitizeTemplateHtml(input)).not.toContain('<iframe');
    });

    it('removes <object> tags', () => {
      const input = '<object data="flash.swf"></object>';
      expect(sanitizeTemplateHtml(input)).not.toContain('<object');
    });

    it('removes <embed> tags', () => {
      const input = '<embed src="plugin.swf" />';
      expect(sanitizeTemplateHtml(input)).not.toContain('<embed');
    });
  });

  describe('event handler removal', () => {
    it('removes onclick with double quotes', () => {
      const input = '<button onclick="alert(1)">Click</button>';
      expect(sanitizeTemplateHtml(input)).not.toContain('onclick');
    });

    it('removes onmouseover with single quotes', () => {
      const input = "<img onmouseover='steal()' src='x.jpg'>";
      expect(sanitizeTemplateHtml(input)).not.toContain('onmouseover');
    });

    it('removes onerror handler', () => {
      const input = '<img src="x.jpg" onerror=alert(1)>';
      expect(sanitizeTemplateHtml(input)).not.toContain('onerror');
    });
  });

  describe('javascript: URL neutralization', () => {
    it('neutralizes javascript: in href double quotes', () => {
      const input = '<a href="javascript:alert(1)">click</a>';
      const result = sanitizeTemplateHtml(input);
      expect(result).not.toContain('javascript:');
      expect(result).toContain('href="#"');
    });

    it('neutralizes javascript: in src single quotes', () => {
      const input = "<img src='javascript:void(0)'>";
      const result = sanitizeTemplateHtml(input);
      expect(result).not.toContain('javascript:');
    });

    it('removes srcdoc attribute', () => {
      const input = '<iframe srcdoc="<script>evil()</script>"></iframe>';
      const result = sanitizeTemplateHtml(input);
      expect(result).not.toContain('srcdoc');
    });
  });

  describe('safe content preservation', () => {
    it('preserves normal HTML structure', () => {
      const safe = '<div class="card"><p>Name: {{NOMBRES}}</p><img src="/logo.png"></div>';
      expect(sanitizeTemplateHtml(safe)).toBe(safe);
    });

    it('preserves style blocks', () => {
      const safe = '<style>.card { color: red; }</style><div class="card"></div>';
      expect(sanitizeTemplateHtml(safe)).toBe(safe);
    });

    it('preserves template placeholders', () => {
      const safe = '<span>{{NOMBRES}}</span><span>{{CURSO}}</span>';
      expect(sanitizeTemplateHtml(safe)).toBe(safe);
    });
  });
});
