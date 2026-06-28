# Kay Stores — Supabase secrets & Edge Functions

Resend and team notification settings live in **Supabase secrets**, not in `.env.local`.

## 1. Run migrations

In the Supabase SQL Editor, run (in order):

- `supabase/migrations/001_products.sql`
- `supabase/migrations/002_orders.sql`
- `supabase/migrations/003_order_pricing.sql`
- `supabase/migrations/004_concierge.sql`
- `supabase/seed.sql` (optional)

## 2. Set secrets (Supabase Dashboard or CLI)

**Dashboard:** Project → Edge Functions → Secrets

**CLI** (from project root, with [Supabase CLI](https://supabase.com/docs/guides/cli) linked):

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxx
supabase secrets set RESEND_FROM_EMAIL="Your Name <noreply@yourdomain.com>"
supabase secrets set KAY_TEAM_EMAIL=team@yourdomain.com
```

| Secret | Purpose |
|--------|---------|
| `RESEND_API_KEY` | Resend API key (never commit) |
| `RESEND_FROM_EMAIL` | Verified sender on your Resend domain |
| `KAY_TEAM_EMAIL` | Internal alerts (new orders, concierge, contact) |

Swap these when you move to the Kay Stores domain — only secrets change, not app code.

## 3. Deploy Edge Functions

```bash
supabase functions deploy send-email --no-verify-jwt
supabase functions deploy send-auth-email --no-verify-jwt
```

`--no-verify-jwt` allows your Next.js server (service role) to invoke `send-email`. Auth hook calls `send-auth-email` with a signed webhook (not JWT).

## 4. Auth emails via Resend (OTP codes)

Signup and password reset use **8-digit codes** on `/verify` (must match **Auth → Providers → Email → OTP length** in Supabase). By default Supabase sends its own magic-link emails — you must enable the **Send Email** hook.

### Enable the hook (one-time, Dashboard)

1. Deploy `send-auth-email` (command above).
2. **Authentication → Hooks → Send Email** → type **HTTPS**.
3. URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-auth-email`
4. Click **Generate secret** and copy the value (starts with `v1,whsec_`).
5. Set the secret on Supabase:

```bash
supabase secrets set SEND_EMAIL_HOOK_SECRET="v1,whsec_xxxxxxxx"
```

6. **Enable** the hook and save.

While the hook is on, Supabase stops sending auth mail itself — all signup / reset emails go through Resend with Kay branding and a numeric code.

| Secret | Purpose |
|--------|---------|
| `SEND_EMAIL_HOOK_SECRET` | Verifies webhook payloads from Supabase Auth |

### Fallback (no hook): SMTP + template

If you prefer not to use the hook, configure **Project Settings → Auth → SMTP** with Resend (`smtp.resend.com`, user `resend`, password = your Resend API key), then edit **Authentication → Email Templates → Confirm signup** to use `{{ .Token }}` instead of `{{ .ConfirmationURL }}`.

## 5. What stays in `.env.local` / Vercel

| Variable | Why |
|----------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | Public Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + server reads with RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only: invoke Edge Functions (not Resend) |
| `NEXT_PUBLIC_APP_URL` | Site links in emails (passed to function in body) |

**Not in `.env`:** `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `KAY_TEAM_EMAIL`, `SEND_EMAIL_HOOK_SECRET`

## 6. Email triggers

| Event | Emails sent |
|-------|-------------|
| Sign up / password reset | 8-digit code via Resend (`send-auth-email` hook) |
| Order placed | Buyer confirmation + team alert + handover link (if gift) |
| Handover completed | Team alert |
| Concierge submitted | Submitter confirmation + team alert |
| Contact form | Team alert |

Orders persist to `public.orders` when Supabase is configured; in-memory fallback remains for local dev without DB.
