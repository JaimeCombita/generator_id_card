export function sanitizeTemplateHtml(input: string): string {
  let sanitized = input;

  sanitized = sanitized.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
  sanitized = sanitized.replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '');
  sanitized = sanitized.replace(/<object[\s\S]*?>[\s\S]*?<\/object>/gi, '');
    sanitized = sanitized.replace(/<embed[\s\S]*?>[\s\S]*?<\/embed>/gi, '');
    sanitized = sanitized.replace(/<embed[^>]*\/?>/gi, '');
  sanitized = sanitized.replace(/<link[^>]*>/gi, '');
  sanitized = sanitized.replace(/<meta[^>]*http-equiv[^>]*>/gi, '');

  sanitized = sanitized.replace(/\son\w+\s*=\s*"[^"]*"/gi, '');
  sanitized = sanitized.replace(/\son\w+\s*=\s*'[^']*'/gi, '');
  sanitized = sanitized.replace(/\son\w+\s*=\s*[^\s>]+/gi, '');

  sanitized = sanitized.replace(/(href|src)\s*=\s*"\s*javascript:[^"]*"/gi, '$1="#"');
  sanitized = sanitized.replace(/(href|src)\s*=\s*'\s*javascript:[^']*'/gi, "$1='#'");
  sanitized = sanitized.replace(/\ssrcdoc\s*=\s*"[^"]*"/gi, '');
  sanitized = sanitized.replace(/\ssrcdoc\s*=\s*'[^']*'/gi, '');

  return sanitized;
}
