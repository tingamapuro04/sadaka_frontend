import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.stubGlobal(
  'fetch',
  vi.fn(async () => new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  }))
);
