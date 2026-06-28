-- Kay Stores: orders & digital handover
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  status text not null default 'confirmed',
  delivery_type text not null check (delivery_type in ('self', 'gift')),
  items jsonb not null default '[]',
  subtotal integer not null check (subtotal >= 0),
  buyer jsonb not null,
  buyer_address jsonb,
  gift jsonb,
  handover_token text unique,
  handover_status text not null default 'not_required',
  recipient_address jsonb,
  created_at timestamptz not null default now()
);

create index if not exists orders_handover_token_idx on public.orders (handover_token);

alter table public.orders enable row level security;

-- MVP: allow anonymous order creation and read (tighten before production)
create policy "Anyone can create orders"
  on public.orders for insert to anon, authenticated with check (true);

create policy "Anyone can read orders"
  on public.orders for select to anon, authenticated using (true);

create policy "Anyone can update handover by token"
  on public.orders for update to anon, authenticated using (true);
