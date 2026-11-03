// Setup file for Jest test environment
process.env.SESSION_SECRET = 'test-session-secret-at-least-32-characters-long-for-jose';
process.env.OWNER_EMAIL = 'wedding.couple@example.com';
process.env.OWNER_PASSCODE = 'wedding2026';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.ENABLE_LOCAL_STORAGE_FALLBACK = 'true';
