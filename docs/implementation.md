# SADAKA PLATFORM — FINAL FRONTEND IMPLEMENTATION PLAN
### React + Vite + TypeScript + Tailwind CSS
### (Enriched with Full API Request/Response Contracts)

---

## TECHNOLOGY STACK

**Core:**
- Framework: React 18+ with TypeScript (strict mode)
- Build Tool: Vite
- Styling: Tailwind CSS (dark mode support)
- Routing: React Router v6
- Server State: TanStack Query (React Query)
- Forms: React Hook Form + Zod validation
- HTTP Client: Axios with interceptors
- UI Primitives: Headless UI + Radix UI

**Testing:**
- Unit/Integration: Vitest (target 80% coverage)
- E2E: Playwright

**Quality:**
- ESLint (strict), Prettier, Husky pre-commit hooks
- No `console.log` in production builds

**Performance Budget:**
- Initial load: < 100KB (gzipped)
- Time to Interactive: < 2s (3G)
- First Contentful Paint: < 1s
- Lighthouse score: > 90

---

## SECURITY PRINCIPLES (ALL PHASES — NON-NEGOTIABLE)

**Authentication:**
- JWT stored in memory (not localStorage) to prevent XSS leaks
- sessionStorage as a documented fallback only
- Token attached via apiClient interceptor only — never as query params
- Separate JWT keys and apiClient instances for church vs. Sadaka admin
- A church admin token must never be usable on `/api/sadaka/*` routes

**Request Handling:**
- API base URL from `.env` only — never hardcoded in source
- All secrets/keys verified at build time via env config
- Request timeout: 30 seconds
- CSRF token support
- 401/403 interceptor clears auth state and redirects to login
- Rate limiting: 429 responses surfaced clearly in UI

**Form Safety:**
- All submit buttons disabled while a request is in-flight (no double-submit)
- Client-side validation for UX only — never a substitute for backend validation
- Input sanitization before every POST
- Password fields cleared from memory after use (especially withdrawals)
- XSS prevention on all inputs

**Production:**
- HTTPS enforced
- Content Security Policy headers
- X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- No sensitive data in the client bundle
- Dependency audit as part of CI

---

## PHASE 1 — PROJECT FOUNDATION

**Goal:** Skeleton everything else plugs into.  
**Timeline:** Week 1

### Directory Structure

```
src/
├── config/
│   ├── api.config.ts          # API base URL, endpoint map
│   ├── env.config.ts          # Env variable validation (fail fast at boot)
│   └── constants.ts           # App constants (TRANSACTION_FEE = 2 KES, etc.)
├── lib/
│   ├── axios.ts               # apiClient: auth headers, 401/403 handling,
│   │                          #   error normalisation, timeout
│   └── query-client.ts        # React Query client + global error handler
├── types/
│   ├── api.types.ts           # Request/response types matching backend contracts
│   └── common.types.ts        # Shared app types
├── utils/
│   ├── validation.ts          # Zod schemas (shared across features)
│   ├── formatters.ts          # Currency (KES), date formatting
│   └── phone.ts               # Kenyan phone validation (254XXXXXXXXX)
├── hooks/
│   ├── useAuth.ts             # Auth state access hook
│   └── useLocalStorage.ts     # Typed, safe storage hook
├── contexts/
│   └── AuthContext.tsx        # In-memory JWT + role state provider
└── components/
    └── shared/
        ├── ErrorBoundary.tsx  # Route-level error isolation
        └── Skeleton.tsx       # Reusable loading skeletons
```

### Deliverables

- [ ] ESLint + Prettier configured
- [ ] Vite + React + TypeScript + Tailwind configured
- [ ] All route shells stubbed and rendering without error
- [ ] `apiClient`: auth headers, 401/403 global handler, error normalisation
- [ ] `AuthContext` with in-memory JWT storage
- [ ] React Query client with `staleTime` defaults and error handling
- [ ] Zod schemas and Kenyan phone validation utility
- [ ] Global error boundary component
- [ ] Loading skeleton components
- [ ] E2E route scaffolding coverage

### Test Gate

App boots, env vars load, all route shells render without crashing.

---

## PHASE 2 — PUBLIC PAYMENT PAGE

**Goal:** `/pay/:username` — the highest-stakes, most user-facing flow.  
**Timeline:** Week 2

### Directory Structure

```
src/
├── pages/
│   └── pay/[username]/
│       ├── index.tsx
│       ├── components/
│       │   ├── PaymentForm.tsx
│       │   ├── CategoryRow.tsx     # Per-category amount input
│       │   ├── SummaryCard.tsx     # Gross, KES 2 fee, total
│       │   └── PaymentStatus.tsx   # Pending / success / error states
│       ├── hooks/
│       │   └── usePayment.ts
│       └── types.ts
└── components/shared/
    ├── PhoneInput.tsx             # Kenyan phone format input
    ├── AmountInput.tsx            # Number field with KES label
    └── ErrorDisplay.tsx
```

### API Contracts

#### `GET /api/pay/:username` — Load church and payment options

No request body. No authentication required.

**Success response `200`:**
```json
{
  "church": {
    "id": "uuid",
    "name": "Grace Community",
    "username": "grace-community",
    "phone": "2547xxxxxxx",
    "email": "admin@church.org",
    "logo_url": "https://cdn.example.com/logos/grace.png",
    "groups_enabled": true,
    "withdrawal_method": "phone",
    "withdrawal_number": "2547xxxxxxx",
    "payment_url": "https://sadaka.co.ke/pay/grace-community"
  },
  "categories": [
    { "id": "uuid", "name": "Tithe" },
    { "id": "uuid", "name": "Offering" }
  ],
  "groups": [
    { "id": "uuid", "name": "Youth" },
    { "id": "uuid", "name": "Women's Guild" }
  ]
}
```

**Error responses:**
- `404` — username not found → show friendly "Church not found" page
- `400` — invalid username format

#### `POST /api/pay/:username` — Initiate payment (STK push)

No authentication required.

**Request body:**
```json
{
  "payer_name": "John Doe",
  "payer_phone": "254712345678",
  "group_id": "uuid",
  "items": [
    { "category_id": "uuid", "amount": 500 },
    { "category_id": "uuid", "amount": 200 }
  ]
}
```

> `payer_name` is optional. `group_id` is optional (only include if `groups_enabled` is true). `items` must contain at least one entry with a whole-number amount ≥ 1. Duplicate `category_id` values are not allowed.

**Success response `200`:**
```json
{
  "transaction_id": "uuid",
  "status": "awaiting_payment",
  "gross_amount": 700,
  "fee": 2,
  "total_amount": 702
}
```

**Error responses:**
- `400` — validation failure (invalid phone, missing items, duplicate categories)
- `422` — business rule violation (group_id supplied but groups not enabled)

### Validation Rules (client-side, enforced via Zod)

- `payer_phone`: valid Kenyan format — `254XXXXXXXXX` (12 digits, starts with `254`)
- `items`: array with ≥ 1 entry; each `amount` must be a positive whole number
- No duplicate `category_id` values across items
- `group_id` only submitted if `church.groups_enabled === true`

### Features

- [ ] Fetch church data on load — friendly "Church not found" page on 404
- [ ] Church logo, name, and payment purpose header
- [ ] Active category amount inputs (one row per active category)
- [ ] Group selector — shown only if `groups_enabled` is true
- [ ] Optional payer name field
- [ ] Kenyan phone number field (required) with format validation
- [ ] Real-time summary: gross total, KES 2 fee (visually prominent), total charged
- [ ] Fee disclaimer: `"KES 2 transaction fee retained by Sadaka"`
- [ ] Form validation via Zod before submission
- [ ] Normalize and sanitize form input before submission
- [ ] Submit: `POST /api/pay/:username` — disable button + show spinner immediately
- [ ] Success state: `"Check your phone to complete payment"`
- [ ] Error state: clear message with retry path
- [ ] Mobile-first, fully responsive layout
- [ ] Church data cached for 5 minutes (React Query `staleTime`)
- [ ] Lazy-loaded route chunk

### Test Gate

Form renders, validates phone, rejects invalid input, submits, and correctly shows pending/success/error states. Submit button cannot be clicked twice.
Only valid payloads are submitted to `POST /api/pay/:username`.

---

## PHASE 3 — CHURCH REGISTRATION + AUTHENTICATION

**Goal:** Onboarding flow and JWT-based login with role-aware routing.  
**Timeline:** Week 3

### Directory Structure

```
src/
├── pages/
│   ├── register/
│   │   ├── index.tsx
│   │   ├── components/
│   │   │   ├── ChurchInfoForm.tsx
│   │   │   ├── AdminAccountForm.tsx
│   │   │   └── WithdrawalSetupForm.tsx
│   │   └── hooks/useChurchRegistration.ts
│   └── admin/
│       └── login.tsx
└── components/auth/
    ├── ProtectedRoute.tsx        # Redirects unauthenticated users
    ├── RoleBasedGuard.tsx        # Gates mutating controls by role
    └── LoginForm.tsx             # Reusable form component
```

### API Contracts

#### `POST /api/churches/register` — Register new church

**Content-Type:** `multipart/form-data`

**Form fields:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | ✅ | Church display name |
| `username` | string | ✅ | Unique slug, used in payment URL |
| `phone` | string | ✅ | Kenyan format: `254XXXXXXXXX` |
| `email` | string | ❌ | Optional contact email |
| `password` | string | ✅ | Admin account password |
| `withdrawal_method` | string | ✅ | `"phone"` or `"till"` or `"paybill"` |
| `withdrawal_number` | string | ✅ | Destination for withdrawals |
| `logo` | file | ❌ | Image file (PNG/JPG) |

**Success response `201`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "church": {
    "id": "uuid",
    "name": "Grace Community",
    "username": "grace-community",
    "phone": "2547xxxxxxx",
    "email": "admin@church.org",
    "logo_url": "https://cdn.example.com/logos/grace.png",
    "groups_enabled": false,
    "withdrawal_method": "phone",
    "withdrawal_number": "2547xxxxxxx",
    "payment_url": "https://sadaka.co.ke/pay/grace-community"
  }
}
```

> Store `token` in memory immediately. No second login required. Redirect to `/admin/dashboard`.

**Error responses:**
- `400` — validation failure (missing fields, invalid phone)
- `409` — username already taken

#### `POST /api/auth/login` — Church admin login

**Content-Type:** `application/json`

**Request body:**
```json
{
  "phone": "254712345678",
  "password": "secret"
}
```

**Success response for `church_super_admin` `200`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "church_super_admin",
  "church": {
    "id": "uuid",
    "name": "Grace Community",
    "username": "grace-community",
    "phone": "2547xxxxxxx",
    "email": "admin@church.org",
    "logo_url": "https://cdn.example.com/logos/grace.png",
    "groups_enabled": true,
    "withdrawal_method": "phone",
    "withdrawal_number": "2547xxxxxxx",
    "payment_url": "https://sadaka.co.ke/pay/grace-community"
  }
}
```

**Success response for `readonly` admin `200`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "readonly"
}
```

**Error responses:**
- `401` — invalid credentials → display generic `"Invalid phone or password"` (never field-specific)
- `429` — rate limited → surface clearly in UI

> Send `Authorization: Bearer <token>` on all subsequent protected requests.

### Registration Features

- [ ] Multi-step form (church info → admin account → withdrawal setup)
- [ ] Logo upload: `multipart/form-data`, client-side size/dimension validation, preview before submission
- [ ] Debounced username availability check
- [ ] Password strength meter
- [ ] Terms & conditions acceptance
- [ ] `POST /api/churches/register` — on success, store JWT + role immediately → redirect to `/admin/dashboard`

### Auth Features

- [ ] Church admin login: `POST /api/auth/login`
- [ ] Store JWT and role (`church_super_admin` | `readonly`) in memory
- [ ] Role-aware route guards evaluated on every render
- [ ] 401/403 interceptor clears auth state → redirects to `/admin/login`
- [ ] On failure: generic `"Invalid phone or password"` — no field-specific hints
- [ ] Auto-logout on inactivity (session timeout warning modal first)
- [ ] Password visibility toggle
- [ ] Login attempt feedback (rate limit UI awareness)

### Test Gate

Register flow stores JWT and routes to dashboard. Login and logout work end-to-end. Protected routes redirect unauthenticated users. 401 response clears session and redirects.

---

## PHASE 4 — CHURCH ADMIN DASHBOARD

**Goal:** Core admin experience — data, transactions, categories, groups, settings.  
**Timeline:** Weeks 4–5

### Directory Structure

```
src/
├── layouts/
│   └── AdminLayout.tsx           # Sidebar + header shell
└── pages/admin/
    ├── dashboard/index.tsx
    ├── transactions/
    │   ├── index.tsx
    │   └── components/
    │       ├── TransactionTable.tsx
    │       ├── TransactionFilters.tsx
    │       └── ExportButton.tsx
    ├── categories/
    │   ├── index.tsx
    │   └── CategoryModal.tsx
    ├── groups/
    │   ├── index.tsx
    │   └── GroupManager.tsx
    └── church/
        ├── settings.tsx
        └── logo-upload.tsx
```

### API Contracts

#### `GET /api/admin/dashboard` — Dashboard KPIs

**Headers:** `Authorization: Bearer <token>`  
No request body.

**Success response `200`:**
```json
{
  "total_income": 150000,
  "transaction_counts": {
    "today": 12,
    "week": 87,
    "month": 340
  },
  "by_category": [
    { "category_id": "uuid", "name": "Tithe", "total": 90000 },
    { "category_id": "uuid", "name": "Offering", "total": 60000 }
  ],
  "by_group": [
    { "group_id": "uuid", "name": "Youth", "total": 30000 }
  ],
  "available_balance": 48500
}
```

> `available_balance` is only present for `church_super_admin` role. Do not render balance card for `readonly` users.

#### `GET /api/admin/transactions` — Paginated transaction list

**Headers:** `Authorization: Bearer <token>`

**Query parameters:**

| Param | Type | Notes |
|---|---|---|
| `page` | integer | Default: `1` |
| `status` | string | e.g. `"paid"`, `"failed"`, `"pending"` |
| `phone` | string | Filter by payer phone |
| `mpesa_ref` | string | Filter by M-PESA reference |
| `from` | ISO date | Start of date range |
| `to` | ISO date | End of date range |
| `category_id` | uuid | Filter by category |

**Success response `200`:**
```json
{
  "total": 123,
  "page": 1,
  "transactions": [
    {
      "id": "uuid",
      "church_id": "uuid",
      "group_id": "uuid",
      "payer_name": "John Doe",
      "payer_phone": "2547xxxxxxx",
      "gross_amount": 500,
      "fee": 2,
      "total_amount": 502,
      "status": "paid",
      "mpesa_ref": "ABC123",
      "created_at": "2026-05-20T10:30:00.000Z"
    }
  ]
}
```

#### `GET /api/admin/transactions/export` — CSV download

**Headers:** `Authorization: Bearer <token>`  
Accepts same query params as the list endpoint. Returns CSV file as a download stream.

> Use an anchor tag (`<a href="...">`) with the auth token passed as a header via a server-side proxy, or generate a short-lived signed URL — do not buffer the file in JS memory.

#### `GET /api/admin/categories` — List categories

**Headers:** `Authorization: Bearer <token>`  
No request body.

**Success response `200`:**
```json
[
  { "id": "uuid", "name": "Tithe", "is_active": true },
  { "id": "uuid", "name": "Harambee", "is_active": false }
]
```

#### `POST /api/admin/categories` — Create category

**Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

**Request body:**
```json
{ "name": "Building Fund" }
```

**Success response `201`:**
```json
{ "id": "uuid", "name": "Building Fund", "is_active": true }
```

#### `PATCH /api/admin/categories/:id` — Update category

**Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

**Request body (all fields optional):**
```json
{ "name": "New Name", "is_active": false }
```

**Success response `200`:**
```json
{ "id": "uuid", "name": "New Name", "is_active": false }
```

#### `GET /api/admin/groups` — List groups

**Headers:** `Authorization: Bearer <token>`  
No request body.

**Success response `200`:**
```json
[
  { "id": "uuid", "name": "Youth", "is_active": true },
  { "id": "uuid", "name": "Elders", "is_active": true }
]
```

#### `POST /api/admin/groups` — Create group

**Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

**Request body:**
```json
{ "name": "Women's Guild" }
```

**Success response `201`:**
```json
{ "id": "uuid", "name": "Women's Guild", "is_active": true }
```

#### `PATCH /api/admin/groups/:id` — Update group

**Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

**Request body (all fields optional):**
```json
{ "name": "New Name", "is_active": false }
```

**Success response `200`:**
```json
{ "id": "uuid", "name": "New Name", "is_active": false }
```

#### `PATCH /api/admin/church/groups` — Toggle groups feature

**Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

**Request body:**
```json
{ "groups_enabled": true }
```

**Success response `200`:**
```json
{ "groups_enabled": true }
```

#### `GET /api/admin/church` — Get church profile

**Headers:** `Authorization: Bearer <token>`  
No request body.

**Success response `200`:**
```json
{
  "id": "uuid",
  "name": "Grace Community",
  "username": "grace-community",
  "phone": "2547xxxxxxx",
  "email": "admin@church.org",
  "logo_url": "https://cdn.example.com/logos/grace.png",
  "groups_enabled": true,
  "withdrawal_method": "phone",
  "withdrawal_number": "2547xxxxxxx",
  "payment_url": "https://sadaka.co.ke/pay/grace-community"
}
```

#### `PATCH /api/admin/church` — Update church settings

**Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

**Request body (all fields optional):**
```json
{
  "name": "Grace Community Church",
  "phone": "254712345678",
  "email": "newemail@church.org",
  "withdrawal_method": "phone",
  "withdrawal_number": "254712345678"
}
```

**Success response `200`:** Updated church object (same shape as `GET /api/admin/church`).

#### `POST /api/admin/church/logo` — Upload church logo

**Headers:** `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`

**Form field:** `logo` — image file (PNG/JPG)

**Success response `200`:**
```json
{ "logo_url": "https://cdn.example.com/logos/grace-updated.png" }
```

#### `GET /api/admin/audit-logs` — Church audit log

**Headers:** `Authorization: Bearer <token>`  
No request body.

**Success response `200`:**
```json
[
  {
    "id": "uuid",
    "action": "category_created",
    "actor": "254712345678",
    "details": { "name": "Building Fund" },
    "created_at": "2026-05-20T08:00:00.000Z"
  }
]
```

### Features

**Dashboard `/admin/dashboard`:**
- [ ] KPI cards: `total_income`, transaction counts (today / week / month)
- [ ] Category and group breakdown charts (pie + bar)
- [ ] `available_balance` — visible to `church_super_admin` only
- [ ] Recent transactions preview list
- [ ] Auto-refresh every 30 seconds

**Transactions `/admin/transactions`:**
- [ ] Paginated table with filters: `status`, `phone`, `mpesa_ref`, date range, `category_id`
- [ ] Sortable columns
- [ ] Search by phone or M-PESA reference
- [ ] Transaction detail modal
- [ ] CSV export via `GET /api/admin/transactions/export?<filters>` — file never buffered in JS memory
- [ ] React Query `invalidateQueries` after any mutation

**Categories & Groups:**
- [ ] List with active/inactive toggle
- [ ] Create and edit (inline or modal)
- [ ] Groups feature toggle via `PATCH /api/admin/church/groups`
- [ ] Disable deletion if category/group has associated transactions
- [ ] Optimistic updates for status toggles

**Church Settings `/admin/church`:**
- [ ] Edit church name, phone, email, `withdrawal_method`, `withdrawal_number`
- [ ] Logo upload via `POST /api/admin/church/logo` as `multipart/form-data`
- [ ] Change password

**Role Enforcement (critical):**
- [ ] `readonly` role: zero mutating controls rendered (no Add/Save/Delete)
- [ ] Gating at component level — not only at the route level

**Performance:**
- [ ] Virtual scrolling for large transaction lists
- [ ] Debounced search/filter inputs
- [ ] Cursor-based pagination
- [ ] Lazy-loaded charts and heavy components
- [ ] Cache invalidated after every mutation — no stale financial data

### Test Gate

Data loads. CRUD mutates and cache refreshes correctly. Filters and pagination work. CSV export streams without buffering. Readonly user sees zero mutating controls from any entry point.

---

## PHASE 5 — WITHDRAWALS + ADMIN ACCOUNTS

**Goal:** Financial operations and sub-account management.  
**Timeline:** Week 6

### Directory Structure

```
src/pages/admin/
├── withdrawals/
│   ├── index.tsx
│   ├── WithdrawalForm.tsx       # Password-gated modal
│   └── WithdrawalHistory.tsx
└── accounts/
    └── index.tsx
```

### API Contracts

#### `GET /api/admin/withdrawals` — List withdrawals

**Headers:** `Authorization: Bearer <token>`  
No request body.

**Success response `200`:**
```json
[
  {
    "id": "uuid",
    "amount": 10000,
    "status": "completed",
    "scheduled_for": "2026-06-01T10:00:00.000Z",
    "created_at": "2026-05-20T09:00:00.000Z",
    "destination": "2547xxxxxxx",
    "method": "phone"
  }
]
```

#### `POST /api/admin/withdrawals` — Request withdrawal

**Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

**Request body:**
```json
{
  "amount": 10000,
  "password": "current-password",
  "scheduled_for": "2026-06-01T10:00:00.000Z"
}
```

> `method` and `withdrawal_number` are read from the church profile server-side. Do NOT include them in the request body.  
> `scheduled_for` must be a future ISO 8601 datetime.  
> `password` is the current admin account password — cleared from memory immediately after submission.

**Success response `201`:**
```json
{
  "id": "uuid",
  "amount": 10000,
  "status": "scheduled",
  "scheduled_for": "2026-06-01T10:00:00.000Z",
  "created_at": "2026-05-20T09:05:00.000Z"
}
```

**Error responses:**
- `401` — incorrect password
- `400` — invalid amount or date (past datetime, amount exceeds balance)
- `422` — insufficient balance

#### `GET /api/admin/accounts` — List readonly admin accounts

**Headers:** `Authorization: Bearer <token>`  
No request body.

**Success response `200`:**
```json
[
  { "id": "uuid", "phone": "254798765432", "created_at": "2026-04-01T00:00:00.000Z" }
]
```

#### `POST /api/admin/accounts` — Create readonly admin account

**Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

**Request body:**
```json
{ "phone": "254798765432", "password": "newpassword" }
```

**Success response `201`:**
```json
{ "id": "uuid", "phone": "254798765432", "created_at": "2026-05-20T09:10:00.000Z" }
```

#### `DELETE /api/admin/accounts/:id` — Delete readonly admin account

**Headers:** `Authorization: Bearer <token>`  
No request body.

**Success response `204`:** No content.

### Features

**Withdrawals `/admin/withdrawals`:**
- [ ] Paginated withdrawal history for the logged-in church
- [ ] Password-gated withdrawal modal:
  - Amount input with min/max validation
  - Password re-entry field (never stored beyond the single POST)
  - `scheduled_for` datetime picker — future times only
  - Submit disabled while request is in-flight
  - Password field cleared on modal close regardless of outcome
- [ ] Method and destination number read from church profile — not re-entered by user
- [ ] Balances and withdrawal records always refetched from server (no optimistic UI)

**Admin Accounts `/admin/accounts`:**
- [ ] List readonly admin accounts
- [ ] Create account (phone + password)
- [ ] Delete account with confirmation prompt

**Audit Logs `/admin/audit-logs`:**
- [ ] Read-only list view, filterable by action/date — no mutations

### Test Gate

Withdrawal form requires valid password; empty password blocks submission. Submit button disables on click; errors surface clearly. Account create and delete work with confirmation flow.

---

## PHASE 6 — SADAKA SUPER ADMIN PORTAL

**Goal:** Platform-level monitoring and management, fully isolated from church auth.  
**Timeline:** Week 7

### Directory Structure

```
src/
├── layouts/
│   └── SuperAdminLayout.tsx
└── pages/sadaka/
    ├── login.tsx
    ├── dashboard/index.tsx
    ├── churches/
    │   ├── index.tsx
    │   └── [id]/index.tsx
    ├── withdrawals/
    │   ├── index.tsx
    │   └── RetryWithdrawal.tsx
    └── audit-logs/index.tsx
```

### API Contracts

#### `POST /api/sadaka/auth/login` — Super admin login

**Content-Type:** `application/json`

**Request body:**
```json
{ "phone": "2547xxxxxxx", "password": "supersecret" }
```

**Success response `200`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "sadaka_super_admin"
}
```

**Error responses:**
- `401` — invalid credentials

#### `GET /api/sadaka/dashboard` — Platform KPIs

**Headers:** `Authorization: Bearer <sadaka-token>`  
No request body.

**Success response `200`:**
```json
{
  "total_churches": 87,
  "total_volume": 4500000,
  "total_fees": 9000,
  "failed_withdrawals_pending_retry": 3
}
```

#### `GET /api/sadaka/churches` — All churches with balances

**Headers:** `Authorization: Bearer <sadaka-token>`  
No request body.

**Success response `200`:**
```json
[
  {
    "id": "uuid",
    "name": "Grace Community",
    "username": "grace-community",
    "available_balance": 48500,
    "total_volume": 200000
  }
]
```

#### `GET /api/sadaka/churches/:id` — Church detail

**Headers:** `Authorization: Bearer <sadaka-token>`  
No request body.

**Success response `200`:**
```json
{
  "id": "uuid",
  "name": "Grace Community",
  "username": "grace-community",
  "phone": "2547xxxxxxx",
  "email": "admin@church.org",
  "logo_url": "https://...",
  "groups_enabled": true,
  "withdrawal_method": "phone",
  "withdrawal_number": "2547xxxxxxx",
  "payment_url": "https://sadaka.co.ke/pay/grace-community",
  "available_balance": 48500,
  "total_volume": 200000,
  "total_fees_collected": 400
}
```

#### `GET /api/sadaka/withdrawals` — Platform-wide withdrawals

**Headers:** `Authorization: Bearer <sadaka-token>`

**Query parameters:**

| Param | Type | Notes |
|---|---|---|
| `status` | string | e.g. `"failed"`, `"completed"`, `"scheduled"` |
| `church_id` | uuid | Filter to a specific church |

**Success response `200`:**
```json
[
  {
    "id": "uuid",
    "church_id": "uuid",
    "church_name": "Grace Community",
    "amount": 10000,
    "status": "failed",
    "scheduled_for": "2026-06-01T10:00:00.000Z",
    "created_at": "2026-05-20T09:00:00.000Z"
  }
]
```

#### `POST /api/sadaka/withdrawals/:id/retry` — Retry failed withdrawal

**Headers:** `Authorization: Bearer <sadaka-token>`  
No request body.

**Success response `200`:**
```json
{ "id": "uuid", "status": "scheduled" }
```

**Error responses:**
- `404` — withdrawal not found
- `400` — withdrawal is not in a retryable state

#### `GET /api/sadaka/audit-logs` — Platform-wide audit events

**Headers:** `Authorization: Bearer <sadaka-token>`  
No request body.

**Success response `200`:**
```json
[
  {
    "id": "uuid",
    "church_id": "uuid",
    "church_name": "Grace Community",
    "action": "withdrawal_created",
    "actor": "254712345678",
    "details": { "amount": 10000 },
    "created_at": "2026-05-20T09:00:00.000Z"
  }
]
```

### Auth Isolation

- [ ] Completely separate login: `/sadaka/login`
- [ ] Own JWT stored in separate memory key
- [ ] Own `sadakaApiClient` instance (separate auth header builder)
- [ ] Church admin JWT rejected on all `/api/sadaka/*` routes — enforced client-side AND relied on from backend

### Pages

- [ ] `/sadaka/dashboard`: display `total_churches`, `total_volume`, `total_fees`, `failed_withdrawals_pending_retry`
- [ ] `/sadaka/churches`: church list with balances, search, pagination
- [ ] `/sadaka/churches/:id`: church profile, financial totals, transaction list
- [ ] `/sadaka/withdrawals`: platform-wide list, `status` + `church_id` filters, retry button for failed withdrawals
- [ ] `/sadaka/audit-logs`: platform-wide audit events with user/action/date filters
- [ ] Real-time notifications for failed withdrawals

### Test Gate

Sadaka token never grants church admin access and vice versa. All platform pages load correct data. Retry action works and cache refreshes.

---

## PHASE 7 — CHURCH REGISTRATION (SELF-SERVE)

**Goal:** Public-facing onboarding for new churches.  
**Timeline:** Week 7 (parallel to Phase 6)

- [ ] Multi-step registration (already detailed in Phase 3)
- [ ] CAPTCHA (optional, for spam prevention)
- [ ] Rate limiting per IP (surfaced clearly in UI)
- [ ] Email confirmation (optional)
- [ ] Success page with login redirect

---

## PHASE 8 — POLISH, ACCESSIBILITY & MONITORING

**Goal:** Production-ready hardening.  
**Timeline:** Week 8

**Performance:**
- [ ] Code splitting by route (React.lazy + Suspense everywhere)
- [ ] Image optimisation (lazy loading, WebP)
- [ ] Bundle analysis and pruning
- [ ] Preconnect to API domain
- [ ] Service worker for offline support (optional)

**Security Hardening:**
- [ ] CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- [ ] Full dependency vulnerability audit

**Accessibility (WCAG 2.1 AA):**
- [ ] Semantic HTML throughout
- [ ] Full keyboard navigation
- [ ] ARIA labels on all interactive elements
- [ ] Colour contrast compliance
- [ ] Visible focus indicators
- [ ] Screen reader testing

**Monitoring:**
- [ ] Error tracking: Sentry
- [ ] Performance monitoring: Web Vitals
- [ ] Privacy-respecting analytics: Plausible or Umami
- [ ] API response time monitoring

---

## PHASE 9 — TESTING & DEPLOYMENT

**Goal:** Verified, deployable build.  
**Timeline:** Week 9

### Test Structure

```
tests/
├── unit/utils/          # Fee calculation, phone validation, formatters
├── unit/hooks/
├── integration/api/     # apiClient interceptors, React Query flows
├── integration/forms/   # Payment, withdrawal, registration forms
└── e2e/
    ├── payment.spec.ts
    ├── admin.spec.ts
    └── registration.spec.ts
```

- [ ] Unit tests (Vitest) — 80% coverage target
- [ ] Integration tests for all critical flows
- [ ] E2E tests (Playwright) for complete user journeys
- [ ] API contract tests (TypeScript types vs. backend schema)
- [ ] Visual regression tests

### Deployment

- [ ] Vite production build with optimisation
- [ ] Environment configs: dev, staging, prod
- [ ] CI/CD pipeline (GitHub Actions or GitLab CI)
- [ ] CDN for static assets
- [ ] Docker config for containerised deployment
- [ ] Health check endpoint

### Documentation

- [ ] README: setup, env vars, local dev, deployment
- [ ] API integration notes
- [ ] Deployment guide
- [ ] Component Storybook (optional)

---

## IMPLEMENTATION PRIORITIES (MVP FIRST)

**MUST-HAVE:**
1. Public payment page (`/pay/:username`)
2. Church admin login + JWT auth
3. Dashboard + transaction viewing
4. Category management
5. Withdrawal requests (password-gated)

**SHOULD-HAVE:**
1. Group management
2. Church settings + logo upload
3. CSV export
4. Readonly admin accounts

**NICE-TO-HAVE:**
1. Sadaka super admin portal
2. Self-serve church registration
3. Audit logs
4. Real-time failure notifications

---

## RISK REGISTER

| Risk | Mitigation |
|---|---|
| Token theft | Memory storage, HTTPS only, short-lived tokens |
| XSS | Sanitised inputs, CSP headers, no innerHTML |
| Double submission | Disable button on click, server-side idempotency |
| Stale financial data | Always refetch balances/transactions after mutation |
| Auth bleed (church/sadaka) | Separate apiClient instances, separate JWT keys |
| API breaking changes | TypeScript contracts, contract tests in CI |
| Poor mobile experience | Mobile-first design, responsive testing |
| Large bundle | Code splitting, lazy loading, bundle analysis |
| State inconsistency | React Query cache invalidation, no optimistic UI on financial data |

---

## APPENDIX — IMPORTANT BUSINESS RULES

- KES 2 transaction fee must be shown to the payer and is retained by Sadaka
- The payer does not need an account or login to pay
- Groups are optional and only visible if the church has them enabled
- Only `church_super_admin` roles can mutate categories, groups, church settings, withdrawals, and accounts
- `readonly` admins may view all data but see zero mutating UI controls from any entry point
- Method and destination number for withdrawals are always read from the church profile — never re-entered at withdrawal time
- Financial data (balances, transactions, withdrawals) is never optimistically updated — always refetched from server

---

*END OF IMPLEMENTATION PLAN*
