import { describe, expect, it } from 'vitest';
import { env } from '../src/config/env.config';

describe('env config', () => {
  it('loads public client env only', () => {
    expect(env.VITE_API_BASE_URL).toBeTypeOf('string');
    expect(env.VITE_WITHDRAWAL_MODE).toMatch(/^(instant|scheduled)$/);
    expect(env.VITE_PLATFORM_LOGIN_PATH).toMatch(/^\//);
    // JWT secrets must not be required client-side
    expect('VITE_CHURCH_JWT_KEY' in env).toBe(false);
    expect('VITE_ADMIN_JWT_KEY' in env).toBe(false);
  });
});
