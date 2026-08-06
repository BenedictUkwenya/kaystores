-- =============================================================================
-- Kay Stores — run concierge migrations SAFELY in Supabase SQL Editor
-- =============================================================================
-- Deadlock fix: run ONE block at a time (highlight block → Run).
-- 1. Stop `npm run dev` first (or pause ~30s between blocks).
-- 2. Close other SQL editor tabs / running queries.
-- 3. Run blocks in order. Skip any block that errors with "already exists".
-- =============================================================================

-- CHECK what's already applied (run this first, read results):
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'concierge_requests'
order by column_name;

-- =============================================================================
-- BLOCK 1 — 016 vendor dispatch (enum + assignments table)
-- =============================================================================

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

drop policy if exists "Admins manage concierge assignments" on public.concierge_vendor_assignments;
create policy "Admins manage concierge assignments"
  on public.concierge_vendor_assignments for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Vendors read own concierge assignments" on public.concierge_vendor_assignments;
create policy "Vendors read own concierge assignments"
  on public.concierge_vendor_assignments for select to authenticated
  using (vendor_id = public.current_vendor_id());

drop policy if exists "Vendors respond to own concierge assignments" on public.concierge_vendor_assignments;
create policy "Vendors respond to own concierge assignments"
  on public.concierge_vendor_assignments for update to authenticated
  using (vendor_id = public.current_vendor_id())
  with check (vendor_id = public.current_vendor_id());

-- =============================================================================
-- BLOCK 2 — 017 user_id (run alone; wait for success before BLOCK 3)
-- =============================================================================

alter table public.concierge_requests
  add column if not exists user_id uuid references auth.users (id) on delete set null;

create index if not exists concierge_requests_user_id_idx
  on public.concierge_requests (user_id);

-- =============================================================================
-- BLOCK 3 — 017 email normalize + backfill (separate from ALTER to reduce locks)
-- =============================================================================

update public.concierge_requests
set contact_email = lower(trim(contact_email))
where contact_email <> lower(trim(contact_email));

update public.concierge_requests cr
set user_id = u.id
from auth.users u
where cr.user_id is null
  and lower(trim(cr.contact_email)) = lower(trim(u.email));

-- =============================================================================
-- BLOCK 4 — 018 optional read policy
-- =============================================================================

drop policy if exists "Submitters read own concierge by email" on public.concierge_requests;
create policy "Submitters read own concierge by email"
  on public.concierge_requests for select to authenticated
  using (
    lower(trim(contact_email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
  );

-- =============================================================================
-- BLOCK 5 — 019 attachments column (run alone)
-- =============================================================================

alter table public.concierge_requests
  add column if not exists attachments jsonb not null default '[]';

-- =============================================================================
-- BLOCK 6 — 019 storage bucket + policy (run alone)
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('concierge-attachments', 'concierge-attachments', false)
on conflict (id) do nothing;

drop policy if exists "Admins read concierge attachments" on storage.objects;
create policy "Admins read concierge attachments"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'concierge-attachments'
    and public.is_admin()
  );

-- =============================================================================
-- VERIFY (run last)
-- =============================================================================

select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'concierge_requests'
  and column_name in ('user_id', 'attachments', 'dispatched_at');

select id, name, public from storage.buckets where id = 'concierge-attachments';

-- =============================================================================
-- BLOCK 7 — 020 offer selection + fulfilment (run alone)
-- =============================================================================

alter table public.concierge_requests
  add column if not exists selected_assignment_id uuid
    references public.concierge_vendor_assignments (id) on delete set null,
  add column if not exists client_selected_at timestamptz,
  add column if not exists offers_released_at timestamptz,
  add column if not exists auto_release_offers boolean not null default true,
  add column if not exists contact_released_at timestamptz;

alter table public.concierge_vendor_assignments
  add column if not exists offer_images jsonb not null default '[]',
  add column if not exists published_to_client boolean not null default false,
  add column if not exists outcome text not null default 'pending'
    check (outcome in ('pending', 'published', 'selected', 'not_chosen')),
  add column if not exists fulfilment_status text not null default 'pending'
    check (fulfilment_status in ('pending', 'sourcing', 'at_hub', 'completed'));

create index if not exists concierge_requests_status_idx
  on public.concierge_requests (status);

create index if not exists concierge_vendor_assignments_outcome_idx
  on public.concierge_vendor_assignments (outcome);

-- =============================================================================
-- BLOCK 8 — 021 concierge payment (run alone)
-- =============================================================================

alter table public.concierge_requests
  add column if not exists payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'pending', 'paid', 'refunded')),
  add column if not exists payment_reference text,
  add column if not exists payment_amount integer,
  add column if not exists paid_at timestamptz;

create index if not exists concierge_requests_payment_status_idx
  on public.concierge_requests (payment_status);

-- =============================================================================
-- BLOCK 9 — 022 admin presents one offer (run alone)
-- =============================================================================

alter table public.concierge_requests
  add column if not exists recommended_assignment_id uuid
    references public.concierge_vendor_assignments (id) on delete set null,
  add column if not exists recommended_at timestamptz,
  add column if not exists client_feedback text not null default '',
  add column if not exists client_response text not null default 'none'
    check (client_response in ('none', 'pending', 'accepted', 'needs_revision', 'cancelled'));

alter table public.concierge_requests
  alter column auto_release_offers set default false;

create index if not exists concierge_requests_recommended_idx
  on public.concierge_requests (recommended_assignment_id);
