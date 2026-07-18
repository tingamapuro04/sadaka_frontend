import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../src/contexts/AuthContext';
import { SadakaAuthProvider } from '../src/contexts/SadakaAuthContext';
import { ProtectedRoute } from '../src/components/auth/ProtectedRoute';
import { SadakaProtectedRoute } from '../src/components/auth/SadakaProtectedRoute';
import { API_BASE_URL, API_ENDPOINTS } from '../src/config/api.config';

const CHURCH_STORAGE_KEY = 'sadaka_church_auth_v1';
const SADAKA_STORAGE_KEY = 'sadaka_auth_v1';

describe('auth session persistence on refresh', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.mocked(fetch).mockReset();
    vi.mocked(fetch).mockImplementation(
      async () =>
        new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        })
    );
  });

  it('keeps church admin authenticated from sessionStorage when cookie rehydrate fails', async () => {
    sessionStorage.setItem(
      CHURCH_STORAGE_KEY,
      JSON.stringify({ token: 'church-jwt', role: 'church_super_admin' })
    );

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/admin/dashboard']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/admin/dashboard" element={<div>Admin dashboard</div>} />
            </Route>
            <Route path="/admin/login" element={<div>Admin login</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Admin dashboard')).toBeInTheDocument();
    });
    expect(screen.queryByText('Admin login')).not.toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}${API_ENDPOINTS.authMe}`,
      expect.objectContaining({ credentials: 'include' })
    );
  });

  it('keeps sadaka super admin authenticated from sessionStorage when cookie rehydrate fails', async () => {
    sessionStorage.setItem(
      SADAKA_STORAGE_KEY,
      JSON.stringify({ token: 'sadaka-jwt', role: 'sadaka_super_admin' })
    );

    render(
      <SadakaAuthProvider>
        <MemoryRouter initialEntries={['/sadaka/dashboard']}>
          <Routes>
            <Route element={<SadakaProtectedRoute />}>
              <Route path="/sadaka/dashboard" element={<div>Platform dashboard</div>} />
            </Route>
            <Route path="/ops/login" element={<div>Super Admin Login</div>} />
          </Routes>
        </MemoryRouter>
      </SadakaAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Platform dashboard')).toBeInTheDocument();
    });
    expect(screen.queryByText('Super Admin Login')).not.toBeInTheDocument();
  });

  it('restores church session from cookie /auth/me when available', async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/auth/me')) {
        return new Response(
          JSON.stringify({
            token: 'cookie-jwt',
            role: 'church_super_admin',
            church_id: 'c1',
            actor_id: 'a1'
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(null, { status: 404 });
    });

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/admin/dashboard']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/admin/dashboard" element={<div>Admin dashboard</div>} />
            </Route>
            <Route path="/admin/login" element={<div>Admin login</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Admin dashboard')).toBeInTheDocument();
    });

    const stored = JSON.parse(sessionStorage.getItem(CHURCH_STORAGE_KEY) ?? '{}');
    expect(stored.token).toBe('cookie-jwt');
    expect(stored.role).toBe('church_super_admin');
  });
});
