import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockApiClient = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn()
}));

vi.mock('../src/lib/sadaka-axios', () => ({
  sadakaApiClient: mockApiClient
}));

import { fetchSadakaAuditLogs, fetchSadakaChurches } from '../src/pages/sadaka/api';

describe('Sadaka API normalization', () => {
  beforeEach(() => {
    mockApiClient.get.mockReset();
    mockApiClient.post.mockReset();
  });

  it('unwraps audit logs from the backend audit_logs envelope', async () => {
    mockApiClient.get.mockResolvedValueOnce({
      data: {
        audit_logs: [
          {
            id: 'log-1',
            action: 'withdrawal.retry',
            actor: 'super-admin',
            created_at: '2024-01-01T00:00:00.000Z'
          }
        ]
      }
    });

    const logs = await fetchSadakaAuditLogs();

    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      id: 'log-1',
      action: 'withdrawal.retry',
      actor: 'super-admin'
    });
  });

  it('maps church summaries from the backend financial fields', async () => {
    mockApiClient.get.mockResolvedValueOnce({
      data: {
        churches: [
          {
            id: 'church-1',
            name: 'Grace Community',
            username: 'grace',
            available_balance: 1250,
            total_paid: 3000,
            total_withdrawn: 1750
          }
        ]
      }
    });

    const churches = await fetchSadakaChurches();

    expect(churches).toHaveLength(1);
    expect(churches[0]).toMatchObject({
      id: 'church-1',
      name: 'Grace Community',
      username: 'grace',
      available_balance: 1250,
      total_volume: 3000
    });
  });
});
