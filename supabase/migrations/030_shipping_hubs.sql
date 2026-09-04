-- Multiple Kay fulfillment hubs for Terminal origin selection.

create table if not exists public.shipping_hubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  address jsonb not null,
  contact_name text not null,
  contact_email text not null,
  contact_phone text not null,
  -- Empty array = national catch-all (used when no state-specific hub matches).
  service_states text[] not null default '{}',
  is_default boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists shipping_hubs_one_default_idx
  on public.shipping_hubs ((is_default))
  where is_default = true and is_active = true;

create index if not exists shipping_hubs_active_idx
  on public.shipping_hubs (is_active, sort_order);

alter table public.shipping_quotes
  add column if not exists hub_id uuid references public.shipping_hubs (id) on delete set null;

alter table public.shipments
  add column if not exists hub_id uuid references public.shipping_hubs (id) on delete set null;

alter table public.shipping_hubs enable row level security;

comment on table public.shipping_hubs is
  'Kay fulfillment hubs; Terminal quotes pick an origin hub by destination state.';
comment on column public.shipping_hubs.service_states is
  'Nigeria states this hub serves (e.g. Lagos, Ogun). Empty = catch-all.';
