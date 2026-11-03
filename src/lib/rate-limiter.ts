// Sliding window rate limiter for abuse prevention

interface RateLimitRecord {
  timestamps: number[];
}

const ipRequestMap = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 5 minutes with unref to not keep event loop open in tests
if (typeof setInterval !== 'undefined') {
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    ipRequestMap.forEach((record, ip) => {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 60000);
      if (record.timestamps.length === 0) {
        ipRequestMap.delete(ip);
      }
    });
  }, 5 * 60 * 1000);

  if (typeof cleanupTimer?.unref === 'function') {
    cleanupTimer.unref();
  }
}

export interface RateLimitCheckResult {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
}

export function checkRateLimit(
  ip: string,
  maxRequestsPerMinute: number = 20,
  windowMs: number = 60000
): RateLimitCheckResult {
  const now = Date.now();
  let record = ipRequestMap.get(ip);

  if (!record) {
    record = { timestamps: [] };
    ipRequestMap.set(ip, record);
  }

  // Remove timestamps older than window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= maxRequestsPerMinute) {
    const oldest = record.timestamps[0];
    const resetSeconds = Math.ceil((oldest + windowMs - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetSeconds: Math.max(1, resetSeconds),
    };
  }

  record.timestamps.push(now);
  return {
    allowed: true,
    remaining: maxRequestsPerMinute - record.timestamps.length,
    resetSeconds: 60,
  };
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}
