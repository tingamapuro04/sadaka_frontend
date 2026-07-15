# Phase 1 Todos - Project Foundation

Goal: Build the frontend foundation that all later phases depend on.

## 1. Project Setup
- [ ] Initialize Vite + React + TypeScript project in strict mode.
- [ ] Install and configure Tailwind CSS.
- [ ] Set up React Router v6 with base route shells.
- [ ] Add and configure TanStack Query.
- [ ] Add Axios and create a shared API client.
- [ ] Add React Hook Form + Zod.
- [ ] Add Headless UI and/or Radix UI primitives as needed.

## 2. Code Quality Tooling
- [ ] Configure ESLint (strict rules).
- [ ] Configure Prettier and lint/format scripts.
- [ ] Add Husky pre-commit hooks for linting/format checks.
- [ ] Ensure production build blocks `console.log` usage.

## 3. Folder and File Scaffolding
- [ ] Create `src/config/`:
- [ ] Add `api.config.ts` (base URL + endpoint map).
- [ ] Add `env.config.ts` (env validation at startup, fail fast).
- [ ] Add `constants.ts` (shared constants like transaction fee).
- [ ] Create `src/lib/`:
- [ ] Add `axios.ts` (headers, timeout, 401/403 handling, normalized errors).
- [ ] Add `query-client.ts` (default staleTime + global error handler).
- [ ] Create `src/types/`:
- [ ] Add `api.types.ts` (request/response contract types).
- [ ] Add `common.types.ts` (shared domain/app types).
- [ ] Create `src/utils/`:
- [ ] Add `validation.ts` (base Zod schemas).
- [ ] Add `formatters.ts` (KES currency + date formatters).
- [ ] Add `phone.ts` (Kenyan phone validation: `254XXXXXXXXX`).
- [ ] Create `src/hooks/`:
- [ ] Add `useAuth.ts`.
- [ ] Add `useLocalStorage.ts` (typed + safe fallback).
- [ ] Create `src/contexts/`:
- [ ] Add `AuthContext.tsx` (in-memory JWT + role state).
- [ ] Create `src/components/shared/`:
- [ ] Add `ErrorBoundary.tsx`.
- [ ] Add `Skeleton.tsx`.

## 4. Authentication and Request Safety
- [ ] Store JWT in memory by default (not localStorage).
- [ ] Add optional documented `sessionStorage` fallback.
- [ ] Ensure auth token is attached only in Axios interceptor.
- [ ] Enforce 30s request timeout globally.
- [ ] Add 401/403 interceptor behavior: clear auth state and redirect to login.
- [ ] Normalize API error responses for consistent UI handling.
- [ ] Ensure API base URL comes from `.env` only (no hardcoding).

## 5. Route Shells and App Boot
- [ ] Stub all known route shells so they render without runtime errors.
- [ ] Wrap app routes with `ErrorBoundary`.
- [ ] Integrate `AuthContext` and QueryClient providers at app root.
- [ ] Add reusable loading skeletons for route-level placeholders.

## 6. Testing Foundations
- [ ] Set up Vitest with coverage reporting.
- [ ] Set up Playwright with route smoke tests.
- [ ] Add tests for env config loading and fail-fast behavior.
- [ ] Add tests for route shell rendering without crashes.
- [ ] Add tests for `apiClient` 401/403 handling.
- [ ] Add tests for Kenyan phone validation utility.

## 7. Phase 1 Test Gate (Definition of Done)
- [ ] App boots successfully.
- [ ] Required environment variables load and validate.
- [ ] All route shells render without crashing.
- [ ] Core providers (`AuthContext`, QueryClient, Router) are wired correctly.
- [ ] Baseline test suite passes locally.

## Notes
- Keep security principles non-negotiable from day one.
- Treat this checklist as blocking before starting Phase 2.
