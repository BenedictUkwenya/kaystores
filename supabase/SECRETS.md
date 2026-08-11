# Kay Stores — Supabase secrets & Edge Functions

Resend and team notification settings live in **Supabase secrets**, not in `.env.local`.

## 1. Run migrations

In the Supabase SQL Editor, run (in order):

- `supabase/migrations/001_products.sql`
- `supabase/migrations/002_orders.sql`
- `supabase/migrations/003_order_pricing.sql`
- `supabase/migrations/004_concierge.sql`
- …through latest, including `023_vendor_onboarding.sql` and `024_pricing_markup_tiers.sql`
- `supabase/seed.sql` (optional)

## 2. Set secrets (Supabase Dashboard or CLI)

**Dashboard:** Project → Edge Functions → Secrets

**CLI** (from project root, with [Supabase CLI](https://supabase.com/docs/guides/cli) linked):

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxx
# Never use noreply@ / no-reply@ — Resend flags it and inboxes trust you less.
# Production domain (verified in Resend): shoponkay.com
supabase secrets set RESEND_FROM_EMAIL="Kay Stores <hello@shoponkay.com>"
supabase secrets set KAY_TEAM_EMAIL=hello@shoponkay.com
supabase secrets set KAY_REPLY_TO_EMAIL=hello@shoponkay.com
```

| Secret | Purpose |
|--------|---------|
| `RESEND_API_KEY` | Resend API key (never commit) |
| `RESEND_FROM_EMAIL` | Verified sender on **shoponkay.com** — use `hello@`, `support@`, or `team@` (**not** `noreply@`) |
| `KAY_TEAM_EMAIL` | Internal alerts (new orders, concierge, contact) |
| `KAY_REPLY_TO_EMAIL` | Inbox that receives replies (defaults to `KAY_TEAM_EMAIL`) |

**Spam / inbox placement:** see [`docs/EMAIL_DELIVERABILITY.md`](../docs/EMAIL_DELIVERABILITY.md) — domain must be **Verified** in Resend (Kay uses `shoponkay.com`).

**Invite / email links:** Admin invites send **only** the `role_invite` email (via `send-email`) with a live signup URL like `/signup?invite=…&role=vendor`. Do **not** use Supabase `inviteUserByEmail` for vendors — that triggers the auth OTP mail (`You're invited to Kay`) with nowhere useful to enter the code.

The app builds invite URLs with `getEmailSiteUrl()` so they never point at `localhost` (falls back to `https://shoponkay.com`). Set `NEXT_PUBLIC_APP_URL=https://shoponkay.com` on Vercel. Edge secret `PUBLIC_SITE_URL` should also be `https://shoponkay.com` for email logo / auth-hook fallbacks.

After changing email Edge Functions, redeploy:

```bash
supabase functions deploy send-email --no-verify-jwt
supabase functions deploy send-auth-email --no-verify-jwt
```

Swap these when you change the Kay mail domain — only secrets change, not app code. Current production From domain: **shoponkay.com**.

## 3. Deploy Edge Functions

```bash
supabase functions deploy send-email --no-verify-jwt
supabase functions deploy send-auth-email --no-verify-jwt
```

`--no-verify-jwt` allows your Next.js server (service role) to invoke `send-email`. Auth hook calls `send-auth-email` with a signed webhook (not JWT).

## 4. Auth emails via Resend (OTP codes)

Signup / password reset use **8-digit codes** on `/verify` (OTP length must match **Auth → Providers → Email**).

**App path (preferred — avoids Supabase Auth email rate limits):**

1. `POST /api/auth/signup` → Admin `generateLink` (Supabase does **not** send mail) → Resend via `send-email` (`auth_otp`)
2. `POST /api/auth/send-otp` → same for recovery / resend code
3. Browser verifies with `verifyOtp`

Redeploy after email function changes:

```bash
supabase functions deploy send-email --no-verify-jwt
```

### Optional: Send Email hook (safety net)

1. Deploy `send-auth-email` (command above).
2. **Authentication → Hooks → Send Email** → type **HTTPS**.
3. URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-auth-email`
4. Click **Generate secret** and copy the value (starts with `v1,whsec_`).
5. Set the secret on Supabase:

```bash
supabase secrets set SEND_EMAIL_HOOK_SECRET="v1,whsec_xxxxxxxx"
```

6. **Enable** the hook and save.

| Secret | Purpose |
|--------|---------|
| `SEND_EMAIL_HOOK_SECRET` | Verifies webhook payloads from Supabase Auth |

Do **not** rely on client `signUp` / `resetPasswordForEmail` for mail — those hit Auth rate limits even when the hook uses Resend.

## 5. What stays in `.env.local` / Vercel

| Variable | Why |
|----------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | Public Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + server reads with RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only: invoke Edge Functions (not Resend) |
| `NEXT_PUBLIC_APP_URL` | Live site URL for invite/email links (not localhost in production) |

Optional Supabase Edge secret (not in `.env`): `PUBLIC_SITE_URL` — live URL fallback for the auth-hook invite template.

**Not in `.env`:** `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `KAY_TEAM_EMAIL`, `SEND_EMAIL_HOOK_SECRET`

## 6. Email triggers

| Event | Emails sent |
|-------|-------------|
| Sign up / password reset | 8-digit code via Resend (`/api/auth/signup` + `/api/auth/send-otp` → `send-email` `auth_otp`) |
| Order placed | Buyer confirmation + team alert + handover link (if gift) |
| Handover completed | Team alert |
| Concierge submitted | Submitter confirmation + team alert (+ link to admin concierge) |
| Concierge offers ready / client revision | Team admin alert |
| Concierge dispatched to vendors | Each assigned vendor |
| Shop order paid | Buyer + team + each vendor on the order |
| Contact form | Team alert |

Orders persist to `public.orders` when Supabase is configured; in-memory fallback remains for local dev without DB.
