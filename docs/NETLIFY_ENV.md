# Netlify environment variables (Sadaka frontend)

Set these under **Site configuration → Environment variables**.  
All `VITE_*` values are embedded at **build time** — redeploy after changes.

## Production

| Variable | Example | Required |
|----------|---------|----------|
| `VITE_API_BASE_URL` | `https://sadaka-api.onrender.com` | Yes |
| `VITE_WITHDRAWAL_MODE` | `instant` or `scheduled` | Yes |
| `VITE_PLATFORM_LOGIN_PATH` | `/ops/login` | No (defaults in code) |
| `VITE_PLATFORM_LOGIN_KEY` | long random string | No (soft gate) |

### `VITE_API_BASE_URL` rules

- **Yes:** `https://sadaka-api.onrender.com`
- **No:** `https://sadaka-api.onrender.com/api`
- **No:** `https://sadaka-api.onrender.com/api/v1`

The app appends `/api/v1/...` itself.

## Align with Render

On the Render **API** service, set:

```text
FRONTEND_ORIGIN=https://YOUR-SITE.netlify.app
PAYMENT_BASE_URL=https://YOUR-SITE.netlify.app/pay
MPESA_PUBLIC_BASE_URL=https://sadaka-api.onrender.com
```

`FRONTEND_ORIGIN` must match the browser origin **exactly** (scheme + host, no trailing slash).  
If it is wrong, CORS will block credentialed requests and admins will appear logged out after a page refresh (cookie rehydrate via `/api/auth/me` fails).

## Platform admin URL

Not linked in the public UI. Bookmark:

```text
https://YOUR-SITE.netlify.app/ops/login
```

With key:

```text
https://YOUR-SITE.netlify.app/ops/login?access=YOUR_KEY
```

## Deploy flow

1. Backend healthy on Render (`/health`).
2. Set Netlify env vars above.
3. Deploy frontend (auto from git or manual).
4. Confirm browser network tab calls `https://…onrender.com/api/v1/...`.
