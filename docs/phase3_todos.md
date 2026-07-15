# Phase 3 Todos — Church Registration + Authentication

Based on: `frontend/docs/implementation.md` (Phase 3)

## Goal
- [ ] Implement onboarding flow and JWT-based login with role-aware routing.

## Timeline
- [ ] Target completion within Week 3.

## File/Structure Setup
- [ ] Create `src/pages/register/index.tsx`.
- [ ] Create `src/pages/register/components/ChurchInfoForm.tsx`.
- [ ] Create `src/pages/register/components/AdminAccountForm.tsx`.
- [ ] Create `src/pages/register/components/WithdrawalSetupForm.tsx`.
- [ ] Create `src/pages/register/hooks/useChurchRegistration.ts`.
- [ ] Create `src/pages/admin/login.tsx`.
- [ ] Create `src/components/auth/ProtectedRoute.tsx`.
- [ ] Create `src/components/auth/RoleBasedGuard.tsx`.
- [ ] Create `src/components/auth/LoginForm.tsx`.

## API Integration
- [ ] Integrate `POST /api/churches/register` using `multipart/form-data`.
- [ ] Integrate `POST /api/auth/login` using `application/json`.
- [ ] Ensure `Authorization: Bearer <token>` is sent for protected requests after login/register success.

## Registration Flow
- [ ] Build multi-step registration flow:
- [ ] Step 1: church info.
- [ ] Step 2: admin account.
- [ ] Step 3: withdrawal setup.
- [ ] Add terms & conditions acceptance before submit.
- [ ] Add debounced username availability check.
- [ ] Add password strength meter.
- [ ] Add logo upload support (optional) with preview.
- [ ] Add client-side logo size/dimension validation.
- [ ] On `201` register success:
- [ ] Store JWT in memory immediately.
- [ ] Store role immediately (if returned/derived by auth context flow).
- [ ] Redirect to `/admin/dashboard` without second login.
- [ ] Handle register errors:
- [ ] `400` validation errors surfaced clearly.
- [ ] `409` username already taken message.

## Authentication Flow
- [ ] Build church admin login page with reusable `LoginForm`.
- [ ] Submit login to `POST /api/auth/login`.
- [ ] Persist JWT in memory via auth context.
- [ ] Persist role in memory (`church_super_admin` or `readonly`).
- [ ] Add password visibility toggle.
- [ ] Handle login errors:
- [ ] `401` show only generic message: "Invalid phone or password".
- [ ] `429` show rate-limit-aware feedback.
- [ ] Ensure no field-specific credential hints are shown.

## Route Protection & Access Control
- [ ] Implement `ProtectedRoute` redirect for unauthenticated users.
- [ ] Implement `RoleBasedGuard` for role-based UI/action gating.
- [ ] Evaluate role-aware route guards on every render.
- [ ] Verify mutating controls are blocked for `readonly` users where required.

## Session & Security Behavior
- [ ] Add auth interceptor behavior for `401/403`:
- [ ] Clear auth state.
- [ ] Redirect to `/admin/login`.
- [ ] Implement auto-logout on inactivity.
- [ ] Show session-timeout warning modal before auto-logout.
- [ ] Ensure token is not stored in localStorage by default (in-memory first).

## Request/Validation Details
- [ ] Validate registration phone format as Kenyan `254XXXXXXXXX`.
- [ ] Ensure register form sends required fields:
- [ ] `name`, `username`, `phone`, `password`, `withdrawal_method`, `withdrawal_number`.
- [ ] Ensure optional fields are handled correctly:
- [ ] `email`, `logo`.
- [ ] Ensure login payload shape:
- [ ] `{ "phone": "254712345678", "password": "secret" }`.

## UX/State Handling
- [ ] Disable submit actions during in-flight auth/register requests.
- [ ] Show clear loading, success, and error states across forms.
- [ ] Clear sensitive password values from form state after submit/failure where possible.

## Test Gate (Definition of Done)
- [ ] Register flow stores JWT and routes to `/admin/dashboard`.
- [ ] Login works end-to-end.
- [ ] Logout works end-to-end.
- [ ] Protected routes redirect unauthenticated users.
- [ ] Any `401` response clears session and redirects to `/admin/login`.
- [ ] Role-based protections are enforced for `church_super_admin` vs `readonly`.
