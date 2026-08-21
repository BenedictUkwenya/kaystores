-- Terminal Africa checkout quotes and hub-to-customer fulfillment.
-- Vendor pickup details are stored now for a future direct-fulfillment rollout.

alter table public.products
  add column if not exists shipping_weight_kg numeric(8,3),
  add column if not exists shipping_length_cm numeric(8,2),
  add column if not exists shipping_width_cm numeric(8,2),
  add column if not exists shipping_height_cm numeric(8,2);

alter table public.vendors
  add column if not exists pickup_address jsonb,
  add column if not exists return_address jsonb;

create table if not exists public.shipping_quotes (
  id uuid primary key default gen_random_uuid(),
  token uuid not null unique default gen_random_uuid(),
  terminal_shipment_id text not null,
  terminal_rate_id text not null,
  carrier_name text not null,
  service_name text,
  amount integer not null check (amount >= 0),
  currency text not null default 'NGN',
  delivery_eta text,
  delivery_date timestamptz,
  destination jsonb not null,
  cart_fingerprint text not null,
  expires_at timestamptz not null default now() + interval '30 minutes',
  selected_at timestamptz,
  order_id uuid unique references public.orders (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists shipping_quotes_expires_at_idx
  on public.shipping_quotes (expires_at);

create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete cascade,
  shipping_quote_id uuid references public.shipping_quotes (id) on delete set null,
  terminal_shipment_id text not null unique,
  terminal_rate_id text,
  carrier_name text,
  tracking_number text,
  tracking_url text,
  label_url text,
  status text not null default 'draft',
  events jsonb not null default '[]',
  arranged_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shipments_status_idx on public.shipments (status);

alter table public.shipping_quotes enable row level security;
alter table public.shipments enable row level security;
