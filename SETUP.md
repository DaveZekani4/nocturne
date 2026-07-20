# NOCTURNE RAVE 1.0 — Setup Guide

Everything is wired to real Supabase + Paystack. Here's what to do to bring
it fully online.

## 1. Run the database migrations

In your Supabase project → **SQL Editor**, run these two files in order:

1. `supabase/migrations/0001_init.sql` — tables, RLS policies, RPCs, and
   seeds the 3 ticket tiers from the flyer (Early Bird 80 @ ₦2,000,
   General 420 @ ₦3,000, Pay at Entry @ ₦5,000 gate-only). 80 + 420 = 500
   online-sellable tickets, matching your cap.
2. `supabase/migrations/0002_storage.sql` — creates the `merch-images`
   storage bucket with public read + admin-only write.
3. `supabase/migrations/0003_ticket_passes.sql` — individual scannable
   ticket passes (one row per ticket unit, not per order).

## 2. Create your first admin account

1. In Supabase → **Authentication → Users**, click "Add user" and create
   an account for yourself (email + password) — this is what you'll log
   into `/admin/login` with.
2. Copy that user's UUID from the users table.
3. In **SQL Editor**, run:
   ```sql
   insert into admin_profiles (id, full_name)
   values ('paste-the-uuid-here', 'Your Name');
   ```
4. Repeat for Dio and Christabel once you have their accounts — anyone
   NOT in `admin_profiles` cannot access `/admin/*` even if they somehow
   get a login link, because it's enforced by database-level RLS, not
   just page routing.

## 3. Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (⚠️ keep secret, never expose to browser) |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack → Settings → API Keys & Webhooks |
| `PAYSTACK_SECRET_KEY` | Paystack → Settings → API Keys & Webhooks (⚠️ keep secret) |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` for local dev, your real Vercel URL for production |

Add the same variables in **Vercel → Project Settings → Environment
Variables** before deploying.

## 4. Point Paystack's webhook at your site

In Paystack → **Settings → API Keys & Webhooks**, set the webhook URL to:

```
https://your-domain.vercel.app/api/webhooks/paystack
```

This is what confirms payment and safely increments ticket/merch stock —
without it, orders will stay "pending" forever (the success page has a
fallback verification check, but the webhook is the real source of truth).

## 5. Run it

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` for the public site, `/admin/login` for the
admin panel.

## What's live right now

- **Tickets**: real Supabase data, live realtime updates, stepper cart,
  Paystack checkout, oversell-safe stock via database RPC
- **Gate passes**: every ticket unit gets its own QR code (shown on the
  success page after payment). Gate staff use `/admin/scan` — camera
  scans the QR, auto-checks-in, flags duplicates/invalid codes in
  real time. No app install needed, just a browser with camera access.
- **Merch**: empty on the public site until you upload something in
  `/admin/merch` — then it appears live, instantly, for every visitor
  (realtime subscription, no refresh needed)
- **Admin**: login (Supabase Auth), dashboard (revenue + per-tier stats),
  ticket tier editor (500 → 300 → sold out, exactly as requested),
  merch uploader (drag images in, set price/stock/sizes, publish),
  merch order fulfillment tracking, gate scanner, attendee list
  (search, CSV export)

## Before launch — things you need to fill in

- **WhatsApp group link**: `components/shared/Footer.tsx` has a
  placeholder (`WHATSAPP_GROUP_LINK`) — swap it for your real invite link
  once the group exists.
- **Artist lineup**: `components/shared/ArtistHighlights.tsx` currently
  shows placeholder "SIGNAL//01" style TBA cards — swap in real names
  once the lineup's confirmed.
- **Camera access requires HTTPS** — this works automatically once
  deployed to Vercel (they provide HTTPS by default), but won't work
  testing on plain `http://localhost` on some browsers/devices. Use
  `https://localhost` via `next dev --experimental-https` if you need to
  test the scanner locally before deploying.

## Test payments

Use Paystack's test card while `PAYSTACK_SECRET_KEY` is a test key:
`4084 0840 8408 4081`, any future expiry, CVV `408`, PIN `0000`, OTP
`123456`. Switch to live keys only when you're ready to actually sell.
