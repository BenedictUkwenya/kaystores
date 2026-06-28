-- Vendor order fulfillment, earnings, withdrawals, payment fields

create type public.payment_status as enum ('unpaid', 'pending', 'paid', 'refunded');
create type public.fulfillment_status as enum (
  'awaiting_payment',
  'awaiting_hub_delivery',
  'at_hub',
  'qc_passed',
  'dispatched',
  'completed',
  'cancelled'
);
create type public.earning_status as enum ('pending', 'available', 'paid_out');
create type public.withdrawal_status as enum (
  'pending',
  'approved',
  'processing',
  'paid',
  'rejected'
);

-- ---------------------------------------------------------------------------
-- orders payment fields
-- ---------------------------------------------------------------------------
alter table public.orders
  add column if not exists payment_status public.payment_status not null default 'unpaid',
  add column if not exists paid_at timestamptz,
  add column if not exists payment_reference text;

create index if not exists orders_payment_status_idx on public.orders (payment_status);

-- ---------------------------------------------------------------------------
-- vendor_order_items
-- ---------------------------------------------------------------------------
create table if not exists public.vendor_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  vendor_id uuid not null references public.vendors (id) on delete restrict,
  product_id uuid not null,
  product_name text not null,
  segment public.catalog_segment not null default 'gifting',
  quantity integer not null check (quantity > 0),
  unit_price integer not null check (unit_price >= 0),
  line_total integer not null check (line_total >= 0),
  vendor_earnings integer not null default 0 check (vendor_earnings >= 0),
  fulfillment_status public.fulfillment_status not null default 'awaiting_payment',
  hub_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vendor_order_items_order_id_idx
  on public.vendor_order_items (order_id);
create index if not exists vendor_order_items_vendor_id_idx
  on public.vendor_order_items (vendor_id);
create index if not exists vendor_order_items_fulfillment_idx
  on public.vendor_order_items (fulfillment_status);

-- ---------------------------------------------------------------------------
-- vendor_earnings
-- ---------------------------------------------------------------------------
create table if not exists public.vendor_earnings (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  vendor_order_item_id uuid not null unique references public.vendor_order_items (id) on delete cascade,
  gross_amount integer not null check (gross_amount >= 0),
  platform_fee integer not null default 0 check (platform_fee >= 0),
  net_amount integer not null check (net_amount >= 0),
  status public.earning_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vendor_earnings_vendor_id_idx on public.vendor_earnings (vendor_id);
create index if not exists vendor_earnings_status_idx on public.vendor_earnings (status);

-- ---------------------------------------------------------------------------
-- withdrawal_requests
-- ---------------------------------------------------------------------------
create table if not exists public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  amount integer not null check (amount > 0),
  status public.withdrawal_status not null default 'pending',
  bank_snapshot jsonb not null default '{}',
  admin_note text,
  payment_reference text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists withdrawal_requests_vendor_id_idx
  on public.withdrawal_requests (vendor_id);
create index if not exists withdrawal_requests_status_idx
  on public.withdrawal_requests (status);

-- ---------------------------------------------------------------------------
-- concierge internal notes
-- ---------------------------------------------------------------------------
alter table public.concierge_requests
  add column if not exists admin_notes text;
