# Email deliverability — stopping Kay emails landing in spam

Kay sends mail through **Resend**. If messages go to spam, it is almost always a **domain / DNS** issue, not application code.

## 1. Use your own domain (required for production)

Do **not** rely on `onboarding@resend.dev` in production. Kay’s verified Resend domain is **`shoponkay.com`**. In Supabase secrets set:

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxx
supabase secrets set RESEND_FROM_EMAIL="Kay Stores <hello@shoponkay.com>"
supabase secrets set KAY_TEAM_EMAIL="hello@shoponkay.com"
supabase secrets set KAY_REPLY_TO_EMAIL="hello@shoponkay.com"
```

**Do not use `noreply@` / `no-reply@`.** Resend’s insights flag it (“Don't use no-reply”), and Gmail/Outlook treat one-way From addresses as less trustworthy. Prefer `hello@`, `support@`, or `team@` on `shoponkay.com`, and set `KAY_REPLY_TO_EMAIL` to an inbox someone actually reads.

Redeploy the edge functions after changing secrets:

```bash
supabase functions deploy send-email --no-verify-jwt
supabase functions deploy send-auth-email --no-verify-jwt
```

## 2. Verify the domain in Resend

1. [Resend Dashboard](https://resend.com/domains) → **Add domain** (`shoponkay.com`).
2. Add the DNS records Resend shows you (usually **SPF**, **DKIM**, and optionally **DMARC**).
3. Wait until Resend shows **Verified**.
4. Use only addresses on that domain in `RESEND_FROM_EMAIL` (e.g. `hello@shoponkay.com`).

Without verified SPF + DKIM, Gmail/Outlook will often mark mail as spam.

## 3. DMARC (recommended)

Add a TXT record at `_dmarc.shoponkay.com`:

```text
v=DMARC1; p=none; rua=mailto:hello@shoponkay.com
```

Start with `p=none` while testing. Move to `p=quarantine` or `p=reject` once deliverability is stable.

## 4. Checklist

| Item | Why it helps |
|------|----------------|
| Custom verified domain | Builds sender reputation; avoids shared `resend.dev` pools |
| SPF + DKIM verified in Resend | Proves you authorised the mail server |
| Consistent **From** name (`Kay Stores`) | Reduces “unknown sender” flags |
| **No** `noreply@` / `no-reply@` in From | Resend + inbox providers prefer a replyable sender |
| **Reply-To** set (`KAY_REPLY_TO_EMAIL`) | Real inbox for replies; better trust signals |
| `KAY_TEAM_EMAIL` set | Admin concierge alerts actually send |
| Plain-text part included | Already sent by edge function; helps filters |
| Avoid ALL CAPS / “FREE!!!” in subjects | Transactional subjects are already calm |
| Ask users to add you to contacts once | Helps personal Gmail/Outlook inboxes |

## 5. Test deliverability

1. Send a test concierge request and order confirmation to Gmail and Outlook.
2. In Gmail: **Show original** → look for `spf=pass`, `dkim=pass`, `dmarc=pass`.
3. Use [mail-tester.com](https://www.mail-tester.com) with a one-off test send if needed.

## 6. Auth emails (signup codes)

Auth OTP uses the **`send-auth-email`** hook. Configure the same verified domain for Supabase Auth SMTP **or** keep the hook — both should use `@shoponkay.com`, not `@resend.dev`.

## 7. What Kay already sends

| Event | Recipient |
|-------|-----------|
| New concierge request | Client + **team** (`KAY_TEAM_EMAIL`) |
| Offers ready / client revision | **Team** admin alert |
| Admin dispatches to vendors | **Each assigned vendor** |
| Client pays shop order | Buyer + team + **each vendor** on the order |
| Concierge recommendation | Client |

If team or vendor mail never arrives, check Supabase **Edge Functions → Logs** for `send-email` errors and confirm `RESEND_API_KEY` + `KAY_TEAM_EMAIL` secrets are set.
