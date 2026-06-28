-- Kay Stores: SKU-based product catalog
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  sku text unique not null,
  name text not null,
  slug text unique not null,
  description text not null default '',
  brand text not null default '',
  price integer not null check (price >= 0),
  compare_at_price integer check (compare_at_price is null or compare_at_price >= 0),
  images text[] not null default '{}',
  specs jsonb not null default '{}',
  occasions text[] not null default '{}',
  recipients text[] not null default '{}',
  collections text[] not null default '{}',
  tags text[] not null default '{}',
  in_stock boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists products_slug_idx on public.products (slug);
create index if not exists products_price_idx on public.products (price);
create index if not exists products_created_at_idx on public.products (created_at desc);
create index if not exists products_occasions_idx on public.products using gin (occasions);
create index if not exists products_recipients_idx on public.products using gin (recipients);
create index if not exists products_collections_idx on public.products using gin (collections);
create index if not exists products_tags_idx on public.products using gin (tags);

alter table public.products enable row level security;

create policy "Products are publicly readable"
  on public.products
  for select
  to anon, authenticated
  using (true);
