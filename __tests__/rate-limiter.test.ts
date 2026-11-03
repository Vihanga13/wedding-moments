import { checkRateLimit } from '@/lib/rate-limiter';

describe('Rate Limiter', () => {
  test('allows requests within threshold and blocks excessive calls', () => {
    const testIp = '192.168.1.100';
    const limit = 5;

    // First 5 requests should succeed
    for (let i = 0; i < limit; i++) {
      const res = checkRateLimit(testIp, limit, 60000);
      expect(res.allowed).toBe(true);
    }

    // 6th request must be blocked
    const blockedRes = checkRateLimit(testIp, limit, 60000);
    expect(blockedRes.allowed).toBe(false);
    expect(blockedRes.remaining).toBe(0);
    expect(blockedRes.resetSeconds).toBeGreaterThan(0);
  });
});
