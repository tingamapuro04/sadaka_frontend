import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from '../src/pages/home';
import { apiClient } from '../src/lib/axios';

vi.mock('../src/lib/axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/lib/axios')>();
  return {
    ...actual,
    apiClient: {
      ...actual.apiClient,
      get: vi.fn()
    }
  };
});

describe('Home search UX', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderHome = () =>
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

  it('exposes combobox a11y attributes and keyboard navigation', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        churches: [
          { id: '1', name: 'Grace Community', username: 'grace' },
          { id: '2', name: 'Hope Chapel', username: 'hope' }
        ]
      }
    });

    renderHome();

    const input = screen.getByRole('combobox', { name: /search for a church/i });
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    expect(input).toHaveAttribute('aria-expanded', 'false');

    fireEvent.change(input, { target: { value: 'gra' } });
    await vi.advanceTimersByTimeAsync(350);

    await waitFor(() => {
      expect(screen.getByText('Grace Community')).toBeInTheDocument();
    });

    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox', { name: /search results/i })).toBeInTheDocument();

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    const firstOption = screen.getByRole('option', { name: /grace community/i });
    expect(firstOption).toHaveAttribute('aria-selected', 'true');
    expect(input.getAttribute('aria-activedescendant')).toBeTruthy();
  });

  it('shows empty state when no churches match', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { churches: [] } });

    renderHome();
    const input = screen.getByRole('combobox', { name: /search for a church/i });
    fireEvent.change(input, { target: { value: 'zzzz' } });
    await vi.advanceTimersByTimeAsync(350);

    await waitFor(() => {
      expect(screen.getByText(/No churches match/i)).toBeInTheDocument();
    });
  });

  it('shows error when search fails', async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      message: 'Network down',
      response: { data: { message: 'Search unavailable' } }
    });

    renderHome();
    const input = screen.getByRole('combobox', { name: /search for a church/i });
    fireEvent.change(input, { target: { value: 'grace' } });
    await vi.advanceTimersByTimeAsync(350);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Search unavailable/i);
    });
  });
});
