export const FILE_SIZE_LIMITS = {
  EXCEL: 10 * 1024 * 1024,
  TEMPLATE: 2 * 1024 * 1024,
  ZIP: 20 * 1024 * 1024,
  CAPTURED_PHOTOS: 8 * 1024 * 1024,
} as const;

export const RECORD_LIMITS = {
  ABSOLUTE_MAX: 1000,
  FREE_USER: 5,
} as const;

export const RATE_LIMIT = {
  WINDOW_MS: 60_000,
  MAX_REQUESTS: 12,
} as const;

export const ALLOWED_EXCEL_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
] as const;

export const ALLOWED_PHOTO_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const;

export const PHOTO_MIME_BY_EXTENSION: Record<(typeof ALLOWED_PHOTO_EXTENSIONS)[number], string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

export const PDF_CARDS_PER_PAGE = {
  MIN: 1,
  MAX: 8,
  DEFAULT: 8,
} as const;

export const UPLOAD_PREVIEW = {
  ROWS_PER_PAGE_MOBILE: 5,
  ROWS_PER_PAGE_DESKTOP: 10,
  MAX_VISIBLE_PAGES: 5,
} as const;

export const TRANSPARENT_1PX_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
