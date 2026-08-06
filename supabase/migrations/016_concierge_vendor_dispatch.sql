-- Concierge vendor dispatch: admin sends requests to vendors for sourcing

create type public.concierge_vendor_response as enum (
  'pending',
  'has_product',
  'no_product',
  'need_more_info'
);

create table if not exists public.concierge_vendor_assignments (
  id uuid primary key default gen_random_uuid(),
  concierge_request_id uuid not null references public.concierge_requests (id) on delete cascade,
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  status public.concierge_vendor_response not null default 'pending',
  vendor_notes text not null default '',
  quoted_price integer check (quoted_price is null or quoted_price > 0),
  sent_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (concierge_request_id, vendor_id)
);

create index if not exists concierge_vendor_assignments_request_idx
  on public.concierge_vendor_assignments (concierge_request_id);

create index if not exists concierge_vendor_assignments_vendor_idx
  on public.concierge_vendor_assignments (vendor_id);

alter table public.concierge_requests
  add column if not exists dispatched_at timestamptz;

alter table public.concierge_vendor_assignments enable row level security;

create policy "Admins manage concierge assignments"
  on public.concierge_vendor_assignments for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Vendors read own concierge assignments"
  on public.concierge_vendor_assignments for select to authenticated
  using (vendor_id = public.current_vendor_id());

create policy "Vendors respond to own concierge assignments"
  on public.concierge_vendor_assignments for update to authenticated
  using (vendor_id = public.current_vendor_id())
  with check (vendor_id = public.current_vendor_id());
