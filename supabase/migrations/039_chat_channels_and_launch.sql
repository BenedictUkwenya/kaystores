-- Two-channel chat (customer<->admin, vendor<->admin), notification throttle,
-- vendor dispatch follow-up count, and launch reminder subscribers.

-- ---------------------------------------------------------------------------
-- Kay Kitchen chat channels
-- ---------------------------------------------------------------------------
alter table public.table_request_messages
  add column if not exists channel text;

update public.table_request_messages
  set channel = case when sender_role = 'vendor' then 'vendor' else 'customer' end
  where channel is null;

alter table public.table_request_messages
  alter column channel set default 'customer',
  alter column channel set not null;

alter table public.table_request_messages
  drop constraint if exists table_request_messages_channel_check;
alter table public.table_request_messages
  add constraint table_request_messages_channel_check
  check (channel in ('customer', 'vendor'));

create index if not exists table_request_messages_channel_idx
  on public.table_request_messages (request_id, channel, created_at);

-- Vendors no longer read the raw request row (customer contact lives there).
drop policy if exists "Users read own table requests" on public.table_requests;
create policy "Users read own table requests"
  on public.table_requests for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Staff read table messages" on public.table_request_messages;
create policy "Staff read table messages"
  on public.table_request_messages for select to authenticated
  using (
    public.is_admin()
    or (
      channel = 'customer'
      and exists (
        select 1 from public.table_requests r
        where r.id = request_id and r.user_id = auth.uid()
      )
    )
    or (
      channel = 'vendor'
      and exists (
        select 1 from public.table_requests r
        join public.vendors v on v.id = r.assigned_vendor_id
        where r.id = request_id and v.user_id = auth.uid()
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
      or (
        channel = 'customer'
        and sender_role = 'customer'
        and exists (
          select 1 from public.table_requests r
          where r.id = request_id and r.user_id = auth.uid()
        )
      )
      or (
        channel = 'vendor'
        and sender_role = 'vendor'
        and exists (
          select 1 from public.table_requests r
          join public.vendors v on v.id = r.assigned_vendor_id
          where r.id = request_id and v.user_id = auth.uid()
        )
      )
    )
  );

-- ---------------------------------------------------------------------------
-- Order support chat channels
-- ---------------------------------------------------------------------------
alter table public.order_support_messages
  add column if not exists channel text;

update public.order_support_messages
  set channel = case when sender_role = 'vendor' then 'vendor' else 'customer' end
  where channel is null;

alter table public.order_support_messages
  alter column channel set default 'customer',
  alter column channel set not null;

alter table public.order_support_messages
  drop constraint if exists order_support_messages_channel_check;
alter table public.order_support_messages
  add constraint order_support_messages_channel_check
  check (channel in ('customer', 'vendor'));

create index if not exists order_support_messages_channel_idx
  on public.order_support_messages (order_id, channel, created_at);

drop policy if exists "Staff read order support" on public.order_support_messages;
create policy "Staff read order support"
  on public.order_support_messages for select to authenticated
  using (
    public.is_admin()
    or (
      channel = 'vendor'
      and exists (
        select 1
        from public.vendor_order_items voi
        join public.vendors v on v.id = voi.vendor_id
        where voi.order_id = order_support_messages.order_id
          and v.user_id = auth.uid()
      )
    )
    or (
      channel = 'customer'
      and exists (
        select 1 from public.orders o
        where o.id = order_support_messages.order_id
          and o.user_id = auth.uid()
      )
    )
  );

drop policy if exists "Staff insert order support" on public.order_support_messages;
create policy "Staff insert order support"
  on public.order_support_messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and (
      public.is_admin()
      or (
        channel = 'vendor'
        and sender_role = 'vendor'
        and exists (
          select 1
          from public.vendor_order_items voi
          join public.vendors v on v.id = voi.vendor_id
          where voi.order_id = order_support_messages.order_id
            and v.user_id = auth.uid()
        )
      )
      or (
        channel = 'customer'
        and sender_role = 'customer'
        and exists (
          select 1 from public.orders o
          where o.id = order_support_messages.order_id
            and o.user_id = auth.uid()
        )
      )
    )
  );

-- ---------------------------------------------------------------------------
-- Chat email throttle (one email per thread per recipient per window)
-- ---------------------------------------------------------------------------
create table if not exists public.chat_notification_log (
  thread_key text not null,
  recipient text not null,
  notified_at timestamptz not null default now(),
  primary key (thread_key, recipient)
);

alter table public.chat_notification_log enable row level security;

-- ---------------------------------------------------------------------------
-- Vendor dispatch follow-ups (12h, then 24h)
-- ---------------------------------------------------------------------------
alter table public.vendor_order_items
  add column if not exists hub_reminder_count integer not null default 0;

update public.vendor_order_items
  set hub_reminder_count = 1
  where hub_reminder_sent_at is not null and hub_reminder_count = 0;

-- ---------------------------------------------------------------------------
-- Launch reminder subscribers
-- ---------------------------------------------------------------------------
create table if not exists public.launch_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now(),
  notified_at timestamptz
);

alter table public.launch_subscribers enable row level security;
