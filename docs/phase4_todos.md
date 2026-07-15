# Phase 4 Todos — Church Admin Dashboard

Based on: `frontend/docs/implementation.md` (Phase 4)

## Goal
- [ ] Implement the core church admin experience for dashboard metrics, transactions, categories, groups, and church settings.

## Timeline
- [ ] Target completion within Weeks 4–5.

## File/Structure Setup
- [ ] Create `src/layouts/AdminLayout.tsx` (sidebar + header shell).
- [ ] Create `src/pages/admin/dashboard/index.tsx`.
- [ ] Create `src/pages/admin/transactions/index.tsx`.
- [ ] Create `src/pages/admin/transactions/components/TransactionTable.tsx`.
- [ ] Create `src/pages/admin/transactions/components/TransactionFilters.tsx`.
- [ ] Create `src/pages/admin/transactions/components/ExportButton.tsx`.
- [ ] Create `src/pages/admin/categories/index.tsx`.
- [ ] Create `src/pages/admin/categories/CategoryModal.tsx`.
- [ ] Create `src/pages/admin/groups/index.tsx`.
- [ ] Create `src/pages/admin/groups/GroupManager.tsx`.
- [ ] Create `src/pages/admin/church/settings.tsx`.
- [ ] Create `src/pages/admin/church/logo-upload.tsx`.

## API Integration
- [ ] Integrate `GET /api/admin/dashboard`.
- [ ] Integrate `GET /api/admin/transactions` with query params:
- [ ] `page`, `status`, `phone`, `mpesa_ref`, `from`, `to`, `category_id`.
- [ ] Integrate `GET /api/admin/transactions/export` (same filters as list endpoint).
- [ ] Integrate `GET /api/admin/categories`.
- [ ] Integrate `POST /api/admin/categories`.
- [ ] Integrate `PATCH /api/admin/categories/:id`.
- [ ] Integrate `GET /api/admin/groups`.
- [ ] Integrate `POST /api/admin/groups`.
- [ ] Integrate `PATCH /api/admin/groups/:id`.
- [ ] Integrate `PATCH /api/admin/church/groups` for groups feature toggle.
- [ ] Integrate `GET /api/admin/church`.
- [ ] Integrate `PATCH /api/admin/church`.
- [ ] Integrate `POST /api/admin/church/logo` (`multipart/form-data`).
- [ ] Integrate `GET /api/admin/audit-logs`.
- [ ] Ensure protected requests use `Authorization: Bearer <token>`.

## Dashboard (`/admin/dashboard`)
- [ ] Render KPI cards for `total_income` and transaction counts (`today`, `week`, `month`).
- [ ] Render category and group breakdown charts (pie + bar).
- [ ] Render `available_balance` only for `church_super_admin` role.
- [ ] Render recent transactions preview list.
- [ ] Auto-refresh dashboard data every 30 seconds.

## Transactions (`/admin/transactions`)
- [ ] Render paginated transaction table.
- [ ] Add filters for `status`, `phone`, `mpesa_ref`, date range, and `category_id`.
- [ ] Add sortable table columns.
- [ ] Add search by phone or M-PESA reference.
- [ ] Add transaction detail modal.
- [ ] Add CSV export via `GET /api/admin/transactions/export?<filters>`.
- [ ] Ensure CSV file is streamed/downloaded without buffering full file in JS memory.
- [ ] Invalidate relevant React Query keys after any transaction-related mutation.

## Categories & Groups
- [ ] Render category list with active/inactive state.
- [ ] Render group list with active/inactive state.
- [ ] Implement create and edit flows (inline or modal) for categories.
- [ ] Implement create and edit flows (inline or modal) for groups.
- [ ] Implement groups feature toggle via `PATCH /api/admin/church/groups`.
- [ ] Prevent deletion when category/group has associated transactions.
- [ ] Add optimistic UI updates for active/inactive toggles.

## Church Settings (`/admin/church`)
- [ ] Edit church profile fields: `name`, `phone`, `email`.
- [ ] Edit withdrawal settings: `withdrawal_method`, `withdrawal_number`.
- [ ] Upload/replace logo via `POST /api/admin/church/logo`.
- [ ] Implement change-password flow.

## Role Enforcement (Critical)
- [ ] For `readonly` role, render zero mutating controls (no Add/Save/Delete actions).
- [ ] Enforce role gating at component/action level (not route-only).
- [ ] Verify non-mutating views remain accessible to readonly users.

## Performance & Data Correctness
- [ ] Add virtual scrolling for large transaction lists.
- [ ] Add debounced filter/search inputs.
- [ ] Implement cursor-based pagination model.
- [ ] Lazy-load charts and heavy dashboard/transaction components.
- [ ] Invalidate/refetch caches after every mutation to prevent stale financial data.

## Security & Request Safety
- [ ] Keep all admin endpoints behind auth guard and interceptor handling.
- [ ] Surface rate limit (`429`) and auth (`401/403`) failures clearly.
- [ ] Sanitize mutating payloads before submit.
- [ ] Disable all submit/mutate controls while requests are in-flight.

## Test Gate (Definition of Done)
- [ ] Dashboard data loads correctly for authorized users.
- [ ] Transactions list filters, sorting, and pagination work correctly.
- [ ] Category/group CRUD operations mutate state and refresh cache correctly.
- [ ] CSV export downloads as a stream without buffering full file in browser memory.
- [ ] `readonly` user sees zero mutating controls from all entry points.
