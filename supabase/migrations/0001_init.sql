-- ============================================================
-- NOCTURNE RAVE 1.0 — Core Schema
-- Run this in Supabase SQL Editor (or via supabase db push)
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- ADMIN PROFILES
-- Links a Supabase Auth user to admin privileges. We don't use
-- Supabase's built-in roles for this — a plain table is easier
-- to manage (add/remove admins by inserting/deleting a row).
-- ------------------------------------------------------------
create table if not exists admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

-- Helper used inside RLS policies to check "is the current
-- authenticated user an admin?"
create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from admin_profiles where id = auth.uid()
  );
$$;

-- ------------------------------------------------------------
-- TICKET TIERS
-- ------------------------------------------------------------
create table if not exists ticket_tiers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  price integer not null,              -- kobo
  total_quantity integer not null,      -- admin-editable cap
  quantity_sold integer not null default 0,
  is_active boolean not null default true,
  online_checkout_enabled boolean not null default true, -- false = "Pay at Entry" style, gate-only
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- ORDERS (tickets) — one row per checkout, can contain multiple
-- tiers/quantities via the `items` jsonb array, mirroring the
-- merch cart pattern.
-- items shape: [{ "tier_id": uuid, "tier_name": text, "quantity": int, "unit_price": int }]
-- ------------------------------------------------------------
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  items jsonb not null,
  amount integer not null,              -- total, kobo
  paystack_ref text not null unique,
  status text not null default 'pending' check (status in ('pending','success','failed')),
  checked_in boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists orders_status_idx on orders(status);
create index if not exists orders_paystack_ref_idx on orders(paystack_ref);

-- ------------------------------------------------------------
-- MERCH PRODUCTS
-- ------------------------------------------------------------
create table if not exists merch_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price integer not null,               -- kobo
  sizes text[] not null default '{}',
  image_urls text[] not null default '{}',
  stock_quantity integer not null default 0,
  stock_sold integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- MERCH ORDERS
-- ------------------------------------------------------------
create table if not exists merch_orders (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  cart_items jsonb not null,
  amount integer not null,
  paystack_ref text not null unique,
  status text not null default 'pending' check (status in ('pending','success','failed')),
  fulfillment_status text not null default 'pending' check (fulfillment_status in ('pending','fulfilled')),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- OVERSELL-SAFE STOCK INCREMENTS
-- These RPCs are the ONLY way ticket/merch counts move. They're
-- called from the Paystack webhook (server-only, service role)
-- after a payment is confirmed. The WHERE clause makes the
-- increment atomic and rejects it if it would exceed the cap —
-- protects against two people paying for the "last ticket" at
-- the same time.
-- ------------------------------------------------------------
create or replace function increment_tier_sold(p_tier_id uuid, p_qty integer)
returns boolean
language plpgsql
security definer
as $$
declare
  updated_rows integer;
begin
  update ticket_tiers
  set quantity_sold = quantity_sold + p_qty
  where id = p_tier_id
    and quantity_sold + p_qty <= total_quantity;

  get diagnostics updated_rows = row_count;
  return updated_rows > 0;
end;
$$;

create or replace function increment_merch_sold(p_product_id uuid, p_qty integer)
returns boolean
language plpgsql
security definer
as $$
declare
  updated_rows integer;
begin
  update merch_products
  set stock_sold = stock_sold + p_qty
  where id = p_product_id
    and stock_sold + p_qty <= stock_quantity;

  get diagnostics updated_rows = row_count;
  return updated_rows > 0;
end;
$$;

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ------------------------------------------------------------
alter table admin_profiles enable row level security;
alter table ticket_tiers enable row level security;
alter table orders enable row level security;
alter table merch_products enable row level security;
alter table merch_orders enable row level security;

-- admin_profiles: only admins can read the admin list
create policy "admins can read admin_profiles"
  on admin_profiles for select
  using (is_admin());

-- ticket_tiers: anyone can read active tiers; only admins can write
create policy "public can read active tiers"
  on ticket_tiers for select
  using (is_active = true or is_admin());

create policy "admins can insert tiers"
  on ticket_tiers for insert
  with check (is_admin());

create policy "admins can update tiers"
  on ticket_tiers for update
  using (is_admin());

create policy "admins can delete tiers"
  on ticket_tiers for delete
  using (is_admin());

-- orders: NOT publicly readable (contains PII). Only admins can
-- read via the dashboard. Inserts/updates happen server-side
-- through the service role client (webhook, order API), which
-- bypasses RLS entirely — so no public insert policy is needed.
create policy "admins can read orders"
  on orders for select
  using (is_admin());

create policy "admins can update orders"
  on orders for update
  using (is_admin());

-- merch_products: anyone can read active products; only admins can write
create policy "public can read active merch"
  on merch_products for select
  using (is_active = true or is_admin());

create policy "admins can insert merch"
  on merch_products for insert
  with check (is_admin());

create policy "admins can update merch"
  on merch_products for update
  using (is_admin());

create policy "admins can delete merch"
  on merch_products for delete
  using (is_admin());

-- merch_orders: admin-only read, same reasoning as orders
create policy "admins can read merch_orders"
  on merch_orders for select
  using (is_admin());

-- ------------------------------------------------------------
-- SEED: the three tiers from the flyer
-- ------------------------------------------------------------
insert into ticket_tiers (name, slug, description, price, total_quantity, online_checkout_enabled, sort_order)
values
  ('Early Bird', 'early-bird', 'First 80 signals only', 200000, 80, true, 1),
  ('General Admission', 'general', 'Standard uplink / main floor protocol', 300000, 420, true, 2),
  ('Pay at Entry', 'pay-at-entry', 'Gate protocol — on-site registration only', 500000, 1000000, false, 3)
on conflict (slug) do nothing;

-- ------------------------------------------------------------
-- REALTIME
-- Enable realtime so the ticket ledger + merch stock update
-- live in every open browser tab without a refresh.
-- ------------------------------------------------------------
alter publication supabase_realtime add table ticket_tiers;
alter publication supabase_realtime add table merch_products;
