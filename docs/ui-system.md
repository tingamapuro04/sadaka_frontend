# Sadaka UI system

## Brand

- **Primary actions:** `brand-600` / `brand-700` (emerald) — Pay Now, Save, primary CTAs
- **Neutral chrome:** slate surfaces, `ink` for text hierarchy
- **Info:** sky callouts only
- **Type:** Inter (400–800)

## Spacing & layout

- Page content: `.page-shell` (`max-w-content` + responsive padding)
- Headers: `.page-header` + `.page-title` / `.page-subtitle`
- Cards: `.card` + `.card-pad`
- Prefer 4 / 8 / 12 / 16 / 24 spacing via Tailwind (`p-4`, `gap-3`, `space-y-6`)

## Components

Use shared primitives from `src/components/ui` and `PhoneInput` for all phone fields.

| Use | Component |
|-----|-----------|
| Actions | `Button` (`primary` = brand emerald) |
| Text fields | `Input` / `Select` |
| Sections | `Card` |
| Admin page top | `PageHeader` |
| Metrics | `StatCard` |
| Empty lists | `EmptyState` |
| Status | `StatusBadge` |

## Shells

- **Public:** home, register, logins, pay — no admin sidebar
- **App:** authenticated church + Sadaka portals with sidebar

## Do not

- Use emoji in navigation
- Invent one-off button/input styles on pages
- Mix random border radii; stick to `rounded-lg` / `rounded-xl`
