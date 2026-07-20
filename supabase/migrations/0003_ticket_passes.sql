-- ============================================================
-- Individual scannable ticket passes
-- One row per ticket UNIT (not per order) — if someone buys 3
-- General Admission tickets in one checkout, that's 3 separate
-- passes here, each independently checked in at the gate. This
-- is what actually gets shown as a QR code and scanned on the
-- night, distinct from `orders` which represents the purchase.
-- ============================================================

create table if not exists ticket_passes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  tier_id uuid references ticket_tiers(id),
  tier_name text not null,
  code text not null unique,           -- short unique code, encoded into the QR
  full_name text not null,
  email text not null,
  checked_in boolean not null default false,
  checked_in_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists ticket_passes_order_id_idx on ticket_passes(order_id);
create index if not exists ticket_passes_code_idx on ticket_passes(code);

alter table ticket_passes enable row level security;

-- Not publicly readable — only admins (gate scanner + attendee views).
-- Passes are created server-side via the service role client in the
-- webhook, so no public insert policy is needed.
create policy "admins can read ticket_passes"
  on ticket_passes for select
  using (is_admin());

create policy "admins can update ticket_passes"
  on ticket_passes for update
  using (is_admin());
