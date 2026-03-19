type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogContext = Record<string, unknown>;

const SENSITIVE_KEYS = new Set([
  'adminCode',
  'authorization',
  'token',
  'password',
  'capturedPhotosData',
  'cookie',
]);

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (depth > 4) return '[MaxDepth]';

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, depth + 1));
  }

  if (value && typeof value === 'object') {
    const source = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};

    Object.entries(source).forEach(([key, val]) => {
      if (SENSITIVE_KEYS.has(key)) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = sanitizeValue(val, depth + 1);
      }
    });

    return result;
  }

  return value;
}

function writeLog(level: LogLevel, message: string, context?: LogContext): void {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(context ? { context: sanitizeValue(context) } : {}),
  };

  const method = level === 'debug' ? 'log' : level;

  if (process.env.NODE_ENV === 'production') {
    console[method](JSON.stringify(entry));
    return;
  }

  console[method](`[${entry.ts}] [${level.toUpperCase()}] ${message}`, entry.context ?? '');
}

function buildLogger(baseContext: LogContext = {}) {
  return {
    debug(message: string, context?: LogContext) {
      writeLog('debug', message, { ...baseContext, ...(context ?? {}) });
    },
    info(message: string, context?: LogContext) {
      writeLog('info', message, { ...baseContext, ...(context ?? {}) });
    },
    warn(message: string, context?: LogContext) {
      writeLog('warn', message, { ...baseContext, ...(context ?? {}) });
    },
    error(message: string, context?: LogContext) {
      writeLog('error', message, { ...baseContext, ...(context ?? {}) });
    },
    child(context: LogContext) {
      return buildLogger({ ...baseContext, ...context });
    },
  };
}

export const logger = buildLogger();
