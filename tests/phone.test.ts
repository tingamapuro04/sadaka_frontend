import { describe, expect, it } from 'vitest';
import { isValidKenyanPhone, normalizePhone } from '../src/utils/phone';
import { loginSchema } from '../src/utils/validation';

describe('isValidKenyanPhone', () => {
  it('accepts valid phone number', () => {
    expect(isValidKenyanPhone('254712345678')).toBe(true);
  });

  it('rejects invalid phone number', () => {
    expect(isValidKenyanPhone('0712345678')).toBe(false);
  });
});

describe('normalizePhone + loginSchema', () => {
  it('normalizes local formats to 254…', () => {
    expect(normalizePhone('0712345678')).toBe('254712345678');
    expect(normalizePhone('+254712345678')).toBe('254712345678');
    expect(normalizePhone('712345678')).toBe('254712345678');
  });

  it('accepts 07… input on login after normalize', () => {
    const parsed = loginSchema.safeParse({ phone: '0712345678', password: 'Secret1!' });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.phone).toBe('254712345678');
    }
  });
});
