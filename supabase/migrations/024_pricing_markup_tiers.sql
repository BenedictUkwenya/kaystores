-- Admin-configurable client markup tiers by vendor list-price range

create table if not exists public.pricing_markup_tiers (
  id uuid primary key default gen_random_uuid(),
  min_price integer not null default 0
    check (min_price >= 0),
  max_price integer
    check (max_price is null or max_price >= min_price),
  rate numeric not null default 0
    check (rate >= 0),
  flat_fee integer not null default 0
    check (flat_fee >= 0),
  label text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pricing_markup_tiers_active_idx
  on public.pricing_markup_tiers (active, sort_order, min_price);

alter table public.pricing_markup_tiers enable row level security;

drop policy if exists "Admins manage pricing markup tiers" on public.pricing_markup_tiers;
create policy "Admins manage pricing markup tiers"
  on public.pricing_markup_tiers for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Seed default catch-all (matches previous hard-coded 15%)
insert into public.pricing_markup_tiers (
  min_price,
  max_price,
  rate,
  flat_fee,
  label,
  sort_order,
  active
)
select 0, null, 0.15, 0, 'Default', 0, true
where not exists (
  select 1 from public.pricing_markup_tiers
);
