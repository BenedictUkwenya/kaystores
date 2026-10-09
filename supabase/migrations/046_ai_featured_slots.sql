-- Paid Kay mentions. Admin records the product, the amount, and the dates.
-- Kay only shows a slot while today (Lagos) falls inside those dates.

create table if not exists public.ai_featured_slots (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  amount_ngn integer not null check (amount_ngn >= 0),
  starts_at date not null,
  ends_at date not null,
  note text not null default '',
  created_at timestamptz not null default now(),
  constraint ai_featured_slots_dates check (ends_at >= starts_at)
);

create index if not exists ai_featured_slots_dates_idx
  on public.ai_featured_slots (starts_at, ends_at);

alter table public.ai_featured_slots enable row level security;

drop policy if exists "Admins manage featured slots" on public.ai_featured_slots;

create policy "Admins manage featured slots"
  on public.ai_featured_slots for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
