# Phase 5 Todos

Source: `/frontend/docs/implementation.md`

## Withdrawals `/admin/withdrawals`

- [x] Create `src/pages/admin/withdrawals/index.tsx`
- [x] Create `src/pages/admin/withdrawals/WithdrawalForm.tsx`
- [x] Create `src/pages/admin/withdrawals/WithdrawalHistory.tsx`
- [x] Load paginated withdrawal history for the logged-in church
- [x] Fetch withdrawals from `GET /api/admin/withdrawals`
- [x] Build a password-gated withdrawal modal
- [x] Add amount input with min/max validation
- [x] Add password re-entry field and clear it on close regardless of outcome
- [x] Add `scheduled_for` datetime picker that only allows future times
- [x] Disable submit while the request is in flight
- [x] Read withdrawal method and destination number from the church profile, not from user input
- [x] Refetch balances and withdrawal records from the server after create/update flows

## Admin Accounts `/admin/accounts`

- [x] Create `src/pages/admin/accounts/index.tsx`
- [x] List readonly admin accounts from `GET /api/admin/accounts`
- [x] Add create account flow with phone and password inputs
- [x] Add delete account flow with confirmation prompt
- [x] Clear password fields from memory immediately after account creation submission

## Audit Logs `/admin/audit-logs`

- [x] Create or reuse the audit log list page for read-only viewing
- [x] Ensure the audit log page is filterable by action and date
- [x] Keep audit logs read-only with no mutation controls

## Shared Auth/UX Requirements

- [x] Ensure all protected requests use the church admin JWT auth header
- [x] Keep the auth token in memory only
- [x] Surface `401` and `403` responses clearly in the UI
- [x] Keep all withdrawal and account actions disabled while requests are pending
- [x] Avoid optimistic UI for balances, withdrawals, and account changes

## Test Gate

- [x] Withdrawal form requires a valid password before submit
- [x] Empty password blocks withdrawal submission
- [x] Submit button disables on click
- [x] Withdrawal errors surface clearly to the user
- [x] Account create and delete work with confirmation flow
