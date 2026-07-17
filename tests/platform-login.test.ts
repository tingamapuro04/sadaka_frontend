import { afterEach, describe, expect, it } from 'vitest';
import {
  PLATFORM_LOGIN_PATH,
  hasPlatformLoginAccess,
  platformLoginHref
} from '../src/config/platform-login';

describe('platform login access', () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it('uses a non-public default path', () => {
    expect(PLATFORM_LOGIN_PATH).toBe('/ops/login');
    expect(PLATFORM_LOGIN_PATH).not.toBe('/sadaka/login');
  });

  it('allows access without a key when none is configured', () => {
    expect(hasPlatformLoginAccess('')).toBe(true);
  });

  it('builds href without query when no key is set', () => {
    expect(platformLoginHref()).toBe(PLATFORM_LOGIN_PATH);
  });
});
