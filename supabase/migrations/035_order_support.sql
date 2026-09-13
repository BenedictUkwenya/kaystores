-- Per-order support thread (admin, vendor, and signed-in customer)

create table if not exists public.order_support_messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  sender_id uuid references auth.users (id) on delete set null,
  sender_role text not null
    check (sender_role in ('admin', 'vendor', 'customer')),
  sender_name text not null default 'Kay',
  body text not null,
  created_at timestamptz not null default now(),
  constraint order_support_messages_body_check
    check (length(trim(body)) > 0)
);

create index if not exists order_support_messages_order_created_idx
  on public.order_support_messages (order_id, created_at asc);

alter table public.order_support_messages enable row level security;

drop policy if exists "Staff read order support" on public.order_support_messages;
create policy "Staff read order support"
  on public.order_support_messages for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.vendor_order_items voi
      join public.vendors v on v.id = voi.vendor_id
      where voi.order_id = order_support_messages.order_id
        and v.user_id = auth.uid()
    )
    or exists (
      select 1 from public.orders o
      where o.id = order_support_messages.order_id
        and o.user_id = auth.uid()
    )
  );

drop policy if exists "Staff insert order support" on public.order_support_messages;
create policy "Staff insert order support"
  on public.order_support_messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and (
      public.is_admin()
      or exists (
        select 1
        from public.vendor_order_items voi
        join public.vendors v on v.id = voi.vendor_id
        where voi.order_id = order_support_messages.order_id
          and v.user_id = auth.uid()
      )
      or exists (
        select 1 from public.orders o
        where o.id = order_support_messages.order_id
          and o.user_id = auth.uid()
      )
    )
  );
