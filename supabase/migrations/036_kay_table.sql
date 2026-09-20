-- Kay Table: edible gifts (cakes, chocolates, hampers) + custom requests

alter table public.vendors
  add column if not exists can_list_table boolean not null default false;

comment on column public.vendors.can_list_table is
  'When true, vendor may list products in the Kay Table (edible) collection.';

create table if not exists public.table_requests (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  status text not null default 'submitted'
    check (status in (
      'submitted',
      'reviewing',
      'quoted',
      'accepted',
      'declined',
      'fulfilled'
    )),
  user_id uuid references auth.users (id) on delete set null,
  contact_name text not null,
  contact_email text not null,
  contact_phone text,
  occasion text,
  servings text,
  flavour_notes text,
  style_notes text,
  needed_by date,
  city text,
  budget integer,
  category text not null default 'cake'
    check (category in ('cake', 'chocolate', 'hamper', 'treat', 'other')),
  assigned_vendor_id uuid references public.vendors (id) on delete set null,
  quote_amount integer,
  quote_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists table_requests_status_created_idx
  on public.table_requests (status, created_at desc);

create index if not exists table_requests_email_idx
  on public.table_requests (contact_email);

create index if not exists table_requests_vendor_idx
  on public.table_requests (assigned_vendor_id);

create table if not exists public.table_request_messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.table_requests (id) on delete cascade,
  sender_id uuid references auth.users (id) on delete set null,
  sender_role text not null
    check (sender_role in ('customer', 'vendor', 'admin')),
  sender_name text not null default 'Kay',
  body text not null,
  created_at timestamptz not null default now(),
  constraint table_request_messages_body_check
    check (length(trim(body)) > 0)
);

create index if not exists table_request_messages_request_created_idx
  on public.table_request_messages (request_id, created_at asc);

alter table public.table_requests enable row level security;
alter table public.table_request_messages enable row level security;

-- Service role / admin client used from API; light RLS for authenticated reads
drop policy if exists "Admins manage table requests" on public.table_requests;
create policy "Admins manage table requests"
  on public.table_requests for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Users read own table requests" on public.table_requests;
create policy "Users read own table requests"
  on public.table_requests for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.vendors v
      where v.id = assigned_vendor_id and v.user_id = auth.uid()
    )
  );

drop policy if exists "Anyone insert table requests" on public.table_requests;
create policy "Anyone insert table requests"
  on public.table_requests for insert to anon, authenticated
  with check (true);

drop policy if exists "Staff read table messages" on public.table_request_messages;
create policy "Staff read table messages"
  on public.table_request_messages for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.table_requests r
      where r.id = request_id
        and (
          r.user_id = auth.uid()
          or exists (
            select 1 from public.vendors v
            where v.id = r.assigned_vendor_id and v.user_id = auth.uid()
          )
        )
    )
  );

drop policy if exists "Staff insert table messages" on public.table_request_messages;
create policy "Staff insert table messages"
  on public.table_request_messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and (
      public.is_admin()
      or exists (
        select 1 from public.table_requests r
        where r.id = request_id
          and (
            r.user_id = auth.uid()
            or exists (
              select 1 from public.vendors v
              where v.id = r.assigned_vendor_id and v.user_id = auth.uid()
            )
          )
      )
    )
  );

-- Guests with the request link message via service role in API (same as order support).
