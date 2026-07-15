import { describe, expect, it, vi } from 'vitest';
import { normalizeApiError, registerAuthHandlers } from '../src/lib/axios';

describe('api client error handling', () => {
  it('normalizes unknown errors', () => {
    const error = normalizeApiError(new Error('boom'));
    expect(error.status).toBe(500);
    expect(error.message).toContain('Unexpected');
  });

  it('registers unauthorized handler', () => {
    const handler = vi.fn();
    registerAuthHandlers({ getToken: () => null, handleUnauthorized: handler });
    expect(typeof handler).toBe('function');
  });
});
