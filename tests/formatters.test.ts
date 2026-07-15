import { describe, expect, it } from 'vitest';
import { formatDate } from '../src/utils/formatters';

describe('formatDate', () => {
  it('returns a placeholder for empty values', () => {
    expect(formatDate('')).toBe('—');
    expect(formatDate(undefined as unknown as string)).toBe('—');
  });

  it('formats valid dates', () => {
    expect(formatDate('2026-07-05T12:34:56.000Z')).toContain('2026');
  });
});
