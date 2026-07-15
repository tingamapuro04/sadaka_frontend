# UX Recommendations and Todos

## Done (medium-priority production polish — 2026-07)

- [x] Shared UI primitives: `Button`, `Input`, `Modal` (focus trap + Escape), `EmptyState`, `StatusBadge`, `ConfirmDialog`, `Toast`, `OfflineBanner`
- [x] Toasts for create/update/copy on events, categories, withdrawals
- [x] Empty states on events list/detail and categories
- [x] Confirm dialogs for close event and cancel withdrawal
- [x] Skip link, main landmark, route focus, sidebar `aria-*`
- [x] Lazy-loaded admin/sadaka routes + vendor manual chunks
- [x] Lazy-loaded pay logos (`loading="lazy"`, fixed dimensions)
- [x] React Query: no mutation retry; skip retry on 4xx
- [x] Removed unused client JWT key env vars
- [x] Offline banner on public pay/event-pay pages
- [x] Admin table utility classes for horizontal scroll / touch targets

## Done (P0/P1 UX implementation — 2026-07)

- [x] Pay/event: early fee disclosure, STK “before you pay” steps, group help copy
- [x] Payment success/failure: clearer copy, failure reasons, home + support links
- [x] Home: how-it-works steps, accessible combobox search (arrow keys/Enter), empty/error states
- [x] Sidebar active nav (`aria-current`)
- [x] Dashboard command center: balance-first cards, quick actions, active events, links
- [x] Transactions: filter chips + clear, result count, mobile cards, empty state, status badges

## High-priority UX improvements (remaining)

- Field-level validation polish on multi-step registration (live password rules)
- Provide clearer guidance when the payment username is invalid or missing (mostly done on pay 404).

- Improve the multi-step registration experience.
  - Add a visible stepper or progress indicator to show registration progress.
  - Convert current generic `stepError` state into field-level validation feedback.
  - Include inline guidance for username availability and password requirements.

- Improve mobile/responsive usability.
  - Ensure the top navigation is not overly crowded on small screens; collapse to a mobile menu if needed.
  - Verify all forms, buttons, and cards are easy to tap on mobile.

## Accessibility improvements

- Add accessible labels and ensure all interactive elements are keyboard focusable.
  - Confirm the phone input, selects, and buttons all support keyboard users.
  - Mark optional fields clearly and preserve a consistent required/optional pattern.

- Add alt/fallback handling for church logos.
  - When a church logo fails to load, show a fallback initials or icon state.
  - Use meaningful `alt` text for church images and status icons.

- Improve loading and empty states.
  - Replace placeholder route shells (login page, dashboard shell) with actual UI or progressive skeleton states.
  - Add accessible loading text and use `role="status"` or `aria-busy` where appropriate.

## Payment flow-specific recommendations

- Improve the item allocation experience.
  - Prevent duplicate categories with clearer guidance when a category is already selected.
  - Automatically focus the newly added category row when `Add Category` is clicked.
  - Disable the `Remove` button only when a single row remains and show a tooltip explaining why.

- Improve success/failure flow messaging.
  - Use distinct success and failure pages with stronger emotional confirmation.
  - On success, offer a copyable transaction reference or next step guidance.
  - On failure, encourage retry and offer a clear support/help link.

- Clarify optional group selection behavior.
  - Explain what selecting a group does and why it is optional.
  - If groups are available, show an example or hint text.

## General product UX recommendations

- Audit the app for consistent typography, spacing, and color hierarchy.
  - Use consistent button sizes and text styles across pages.
  - Ensure the highest priority action is visually prominent.

- Add user onboarding / help copy for first-time users.
  - Explain the payment process and M-Pesa STK push in a short hero section.
  - Add contextual help for fields like `M-Pesa Phone Number` and `Church Payment URL`.

- Add a dedicated support or FAQ link in the public payment page.
  - Provide a fallback in case users cannot complete M-Pesa payment.
  - Include a short note about common issues like network, wrong PIN, or timeouts.

## Implementation todos

- [ ] Update payment page CTA text and confirmation copy.
- [ ] Add fee disclosure text near form inputs and summary card.
- [ ] Convert registration step errors into inline field messages.
- [ ] Add a visible stepper/progress bar on the register flow.
- [ ] Improve mobile navigation and test on small screens.
- [ ] Add `aria-live` regions to payment status and error panels.
- [ ] Provide fallback visuals for missing church logos.
- [ ] Strengthen success/failure screens with clear next steps.
- [ ] Add a help/support note on the public payment page.
- [ ] Replace placeholder route shells with real UI or skeleton variants.
