-- Concierge special-request inquiries
create table if not exists public.concierge_requests (
  id uuid primary key default gen_random_uuid(),
  reference_number text unique not null,
  product_name text not null,
  brand text not null default '',
  budget integer not null check (budget > 0),
  description text not null default '',
  contact_name text not null,
  contact_email text not null,
  contact_phone text not null,
  attachment_names jsonb not null default '[]',
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists concierge_requests_created_at_idx
  on public.concierge_requests (created_at desc);

alter table public.concierge_requests enable row level security;

create policy "Anyone can create concierge requests"
  on public.concierge_requests for insert to anon, authenticated with check (true);

create policy "Service can read concierge requests"
  on public.concierge_requests for select to anon, authenticated using (true);
