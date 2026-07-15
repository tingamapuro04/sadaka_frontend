# Phase 2 Todos — Public Payment Page

Based on: `frontend/docs/implementation.md` (Phase 2)

## Goal
- [x] Implement `/pay/:username` as the public payment flow with clear pending/success/error states.

## Timeline
- [ ] Target completion within Week 2.

## File/Structure Setup
- [x] Create `src/pages/pay/[username]/index.tsx`.
- [x] Create `src/pages/pay/[username]/components/PaymentForm.tsx`.
- [x] Create `src/pages/pay/[username]/components/CategoryRow.tsx`.
- [x] Create `src/pages/pay/[username]/components/SummaryCard.tsx`.
- [x] Create `src/pages/pay/[username]/components/PaymentStatus.tsx`.
- [x] Create `src/pages/pay/[username]/hooks/usePayment.ts`.
- [x] Create `src/pages/pay/[username]/types.ts`.
- [x] Create `src/components/shared/PhoneInput.tsx`.
- [x] Create `src/components/shared/AmountInput.tsx`.
- [x] Create `src/components/shared/ErrorDisplay.tsx`.

Note: Implemented under `src/pages/pay/*` (functionally complete, path differs from checklist wording).

## API Integration
- [x] Integrate `GET /api/pay/:username` to load church profile, categories, and groups.
- [x] Handle `GET /api/pay/:username` errors:
- [x] `404` renders a friendly "Church not found" page.
- [x] `400` renders invalid-username feedback.
- [x] Integrate `POST /api/pay/:username` to initiate STK push.
- [x] Map request contract types for submit payload:
- [x] `payer_name` optional.
- [x] `payer_phone` required.
- [x] `group_id` optional and conditional.
- [x] `items` required (at least one item).
- [x] Map response contract types for payment initiation:
- [x] `transaction_id`, `status`, `gross_amount`, `fee`, `total_amount`.
- [x] Handle `POST /api/pay/:username` errors:
- [x] `400` validation failure surfaced clearly.
- [ ] `422` business-rule violation surfaced clearly.

## Validation & Payload Shaping
- [x] Validate `payer_phone` as Kenyan `254XXXXXXXXX` format.
- [x] Validate `items` contains at least one entry.
- [x] Validate each item `amount` is a positive whole number (`>= 1`).
- [x] Reject duplicate `category_id` values across items.
- [x] Only include `group_id` when `church.groups_enabled === true`.
- [ ] Normalize/sanitize payload before submit.

## UX & State Handling
- [x] Fetch church data on load and render church identity (logo, name, purpose context).
- [x] Render one active amount input row per active category.
- [x] Render group selector only when `groups_enabled` is true.
- [x] Render optional payer name field.
- [x] Render required phone field with format guidance and validation.
- [x] Show real-time totals: gross, `KES 2` fee, final total.
- [x] Show fee disclaimer: `KES 2 transaction fee retained by Sadaka`.
- [x] Disable submit while request is in-flight to prevent double-submit.
- [x] Show immediate pending state: "Check your phone to complete payment".
- [x] Show clear error state with retry path.

## Security & Request Safety
- [ ] Sanitize user inputs before `POST /api/pay/:username`.
- [x] Ensure this public route does not attach protected admin tokens by default.
- [x] Use shared timeout behavior (30s) through `apiClient`.
- [x] Use shared error normalization for consistent UI messaging.

## Performance & Responsiveness
- [x] Deliver mobile-first responsive layout for `/pay/:username`.
- [x] Configure church payload caching with React Query `staleTime` of 5 minutes.
- [x] Lazy-load the payment route chunk.

## Test Gate (Definition of Done)
- [x] Form renders with church data and category inputs.
- [x] Invalid phone and invalid amounts are rejected client-side.
- [x] Duplicate category entries are blocked before submit.
- [x] Only valid payloads are submitted to `POST /api/pay/:username`.
- [x] Submit action cannot be triggered twice while in-flight.
- [x] Pending/success/error states render correctly.
- [x] `404` church lookup renders friendly not-found experience.
- [ ] `422` business-rule errors are displayed with actionable guidance.
