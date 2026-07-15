# Phase 6 — Sadaka Super Admin Portal Todos

## Goal

Platform-level monitoring and management, fully isolated from church admin authentication.

## Timeline

Week 7

## Core pages and routes

- [x] `/sadaka/login` — separate super admin login page
- [x] `/sadaka/dashboard` — platform KPI dashboard
- [x] `/sadaka/churches` — searchable/paginated church list with balances
- [x] `/sadaka/churches/:id` — church detail page with financial totals
- [x] `/sadaka/withdrawals` — platform-wide withdrawal list with filters
- [x] `/sadaka/audit-logs` — platform-wide audit events

## Auth isolation

- [x] Use a dedicated `sadakaApiClient` instance for `/api/sadaka/*`
- [x] Store Sadaka JWT in separate memory key from church admin JWT
- [x] Enforce Sadaka auth on client-side route guards for `/sadaka/*`
- [x] Ensure church admin JWT is rejected for Sadaka routes and vice versa
- [x] Show generic login failure UI for invalid super admin credentials

## Dashboard features

- [x] Display `total_churches`, `total_volume`, `total_fees`, and `failed_withdrawals_pending_retry`
- [x] Render KPI cards with clear financial summary
- [x] Add fast refresh or manual refresh behavior for live data

## Churches list

- [x] Show all churches with `available_balance` and `total_volume`
- [x] Add search by church name or username
- [x] Add pagination or cursor-based navigation
- [x] Use platform-wide query caching and invalidation

## Church detail

- [x] Show church profile fields: name, username, contact info, payment URL
- [x] Display financial totals: balance, total volume, fees collected
- [x] Include withdrawal and transaction summaries

## Withdrawals management

- [x] Display platform-wide withdrawals with `status` and `church_id` filters
- [x] Show failed, scheduled, and completed withdrawal states clearly
- [x] Add retry button for failed withdrawals
- [x] Implement `POST /api/sadaka/withdrawals/:id/retry` and refresh list after success
- [x] Handle retry errors for non-retryable or missing withdrawals

## Audit logs

- [x] List platform-wide audit events with filters for action, church, and date
- [x] Show actor, action, details, and timestamp for each audit event
- [x] Keep this view read-only with no mutations

## API contract coverage

- [x] `POST /api/sadaka/auth/login` — super admin login
- [x] `GET /api/sadaka/dashboard` — platform KPIs
- [x] `GET /api/sadaka/churches` — church list with balances
- [x] `GET /api/sadaka/churches/:id` — church detail
- [x] `GET /api/sadaka/withdrawals` — platform-wide withdrawals
- [x] `POST /api/sadaka/withdrawals/:id/retry` — retry failed withdrawal
- [x] `GET /api/sadaka/audit-logs` — platform-wide audit events

## UI and UX

- [x] Use mobile-first responsive design across all Sadaka pages
- [x] Keep loading and error states clear for each page
- [x] Disable retry/action buttons while requests are in-flight
- [x] Avoid buffering large downloads or response payloads in memory

## Test gate

- [x] Sadaka and church auth tokens remain isolated and cannot cross-use
- [x] Sadaka pages load correct data for dashboard, churches, withdrawals, and audit logs
- [x] Retry failed withdrawal action works and refreshes data
- [x] UI renders only authorized Sadaka controls for super admin users
