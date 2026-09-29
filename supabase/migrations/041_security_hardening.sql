-- Security hardening from the full system review.
-- All of these writes now go through server routes using the service role,
-- so the public (anon / any signed-in user) policies are no longer needed.

-- ---------------------------------------------------------------------------
-- orders: no direct inserts/updates from the browser
-- (anyone could previously insert an order already marked "paid")
-- ---------------------------------------------------------------------------
drop policy if exists "Anyone can create orders" on public.orders;
drop policy if exists "Handover update by token" on public.orders;
drop policy if exists "Anyone can update handover by token" on public.orders;

-- ---------------------------------------------------------------------------
-- concierge / Kay Kitchen: created via API only
-- ---------------------------------------------------------------------------
drop policy if exists "Anyone can create concierge requests" on public.concierge_requests;
drop policy if exists "Anyone insert table requests" on public.table_requests;

-- Vendors respond through /api/vendor/concierge (service role, with checks).
drop policy if exists "Vendors respond to own concierge assignments"
  on public.concierge_vendor_assignments;

-- ---------------------------------------------------------------------------
-- vendor_order_items: vendors can't flip their own status or earnings
-- ---------------------------------------------------------------------------
drop policy if exists "Vendors update own fulfillment" on public.vendor_order_items;
drop policy if exists "Service inserts vendor order items" on public.vendor_order_items;

-- ---------------------------------------------------------------------------
-- vendors: Kay Kitchen permission is admin-only, like After Dark
-- ---------------------------------------------------------------------------
drop policy if exists "Vendors update own business info" on public.vendors;
create policy "Vendors update own business info"
  on public.vendors for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (
    public.is_admin()
    or (
      user_id = auth.uid()
      and status = (select v.status from public.vendors v where v.id = vendors.id)
      and can_list_after_dark = (select v.can_list_after_dark from public.vendors v where v.id = vendors.id)
      and can_list_table = (select v.can_list_table from public.vendors v where v.id = vendors.id)
    )
  );

-- ---------------------------------------------------------------------------
-- withdrawals: never more than the released balance, even with parallel requests
-- ---------------------------------------------------------------------------
drop policy if exists "Vendors create withdrawals" on public.withdrawal_requests;
create policy "Vendors create withdrawals"
  on public.withdrawal_requests for insert to authenticated
  with check (
    vendor_id = public.current_vendor_id()
    and status = 'pending'
    and payment_reference is null
    and paid_at is null
    and admin_note is null
  );

create or replace function public.guard_withdrawal_balance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  released bigint;
  committed bigint;
begin
  -- Serialise withdrawals per vendor so two tabs can't both pass the check.
  perform pg_advisory_xact_lock(hashtext('withdrawal:' || new.vendor_id::text));

  select coalesce(sum(net_amount), 0) into released
  from public.vendor_earnings
  where vendor_id = new.vendor_id
    and status in ('available', 'paid_out');

  select coalesce(sum(amount), 0) into committed
  from public.withdrawal_requests
  where vendor_id = new.vendor_id
    and status in ('pending', 'approved', 'processing', 'paid');

  if new.amount > released - committed then
    raise exception 'insufficient_balance'
      using hint = 'Withdrawal exceeds available balance';
  end if;

  return new;
end;
$$;

drop trigger if exists withdrawal_balance_guard on public.withdrawal_requests;
create trigger withdrawal_balance_guard
  before insert on public.withdrawal_requests
  for each row execute function public.guard_withdrawal_balance();

-- ---------------------------------------------------------------------------
-- order support: each vendor gets a private thread with Kay
-- (null vendor_id = legacy messages, visible to every vendor on the order)
-- ---------------------------------------------------------------------------
alter table public.order_support_messages
  add column if not exists vendor_id uuid references public.vendors (id) on delete set null;

create index if not exists order_support_messages_vendor_idx
  on public.order_support_messages (order_id, channel, vendor_id);

drop policy if exists "Staff read order support" on public.order_support_messages;
create policy "Staff read order support"
  on public.order_support_messages for select to authenticated
  using (
    public.is_admin()
    or (
      channel = 'vendor'
      and exists (
        select 1 from public.vendors v
        where v.user_id = auth.uid()
          and (order_support_messages.vendor_id is null or order_support_messages.vendor_id = v.id)
          and exists (
            select 1 from public.vendor_order_items voi
            where voi.order_id = order_support_messages.order_id and voi.vendor_id = v.id
          )
      )
    )
    or (
      channel = 'customer'
      and exists (
        select 1 from public.orders o
        where o.id = order_support_messages.order_id and o.user_id = auth.uid()
      )
    )
  );

drop policy if exists "Staff insert order support" on public.order_support_messages;
