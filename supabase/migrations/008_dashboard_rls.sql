-- Dashboard RLS policies

-- Drop overly permissive policies
drop policy if exists "Products are publicly readable" on public.products;
drop policy if exists "Anyone can update handover by token" on public.orders;
drop policy if exists "Service can read concierge requests" on public.concierge_requests;

-- ---------------------------------------------------------------------------
-- profiles (admin read all)
-- ---------------------------------------------------------------------------
create policy "Admins read all profiles"
  on public.profiles for select to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
create policy "Public reads live products"
  on public.products for select to anon, authenticated
  using (status = 'live');

create policy "Vendors read own products"
  on public.products for select to authenticated
  using (vendor_id = public.current_vendor_id() or public.is_admin());

create policy "Vendors insert own products"
  on public.products for insert to authenticated
  with check (
    public.current_vendor_id() is not null
    and vendor_id = public.current_vendor_id()
    and status in ('draft', 'pending_review')
    and (
      segment = 'gifting'
      or (segment = 'after_dark' and public.vendor_can_list_after_dark())
    )
  );

create policy "Vendors update own products"
  on public.products for update to authenticated
  using (vendor_id = public.current_vendor_id() or public.is_admin())
  with check (
    public.is_admin()
    or (
      vendor_id = public.current_vendor_id()
      and status in ('draft', 'pending_review', 'rejected', 'live')
    )
  );

create policy "Admins manage all products"
  on public.products for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- vendors
-- ---------------------------------------------------------------------------
create policy "Vendors read own row"
  on public.vendors for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "Anyone can apply as vendor"
  on public.vendors for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');

create policy "Vendors update own business info"
  on public.vendors for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (
    public.is_admin()
    or (
      user_id = auth.uid()
      and status = (select v.status from public.vendors v where v.id = vendors.id)
      and can_list_after_dark = (select v.can_list_after_dark from public.vendors v where v.id = vendors.id)
    )
  );

create policy "Admins manage vendors"
  on public.vendors for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- vendor_order_items
-- ---------------------------------------------------------------------------
alter table public.vendor_order_items enable row level security;

create policy "Vendors read own order items"
  on public.vendor_order_items for select to authenticated
  using (vendor_id = public.current_vendor_id() or public.is_admin());

create policy "Vendors update own fulfillment"
  on public.vendor_order_items for update to authenticated
  using (vendor_id = public.current_vendor_id() or public.is_admin())
  with check (vendor_id = public.current_vendor_id() or public.is_admin());

create policy "Service inserts vendor order items"
  on public.vendor_order_items for insert to authenticated
  with check (public.is_admin() or auth.uid() is not null);

create policy "Admins manage vendor order items"
  on public.vendor_order_items for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- vendor_earnings
-- ---------------------------------------------------------------------------
alter table public.vendor_earnings enable row level security;

create policy "Vendors read own earnings"
  on public.vendor_earnings for select to authenticated
  using (vendor_id = public.current_vendor_id() or public.is_admin());

create policy "Admins manage earnings"
  on public.vendor_earnings for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- withdrawal_requests
-- ---------------------------------------------------------------------------
alter table public.withdrawal_requests enable row level security;

create policy "Vendors read own withdrawals"
  on public.withdrawal_requests for select to authenticated
  using (vendor_id = public.current_vendor_id() or public.is_admin());

create policy "Vendors create withdrawals"
  on public.withdrawal_requests for insert to authenticated
  with check (vendor_id = public.current_vendor_id());

create policy "Admins manage withdrawals"
  on public.withdrawal_requests for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- orders (admin full access)
-- ---------------------------------------------------------------------------
create policy "Admins read all orders"
  on public.orders for select to authenticated
  using (public.is_admin());

create policy "Admins update orders"
  on public.orders for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Handover update by token"
  on public.orders for update to anon, authenticated
  using (handover_token is not null and handover_status = 'pending')
  with check (handover_token is not null);

-- ---------------------------------------------------------------------------
-- concierge (admin only reads)
-- ---------------------------------------------------------------------------
create policy "Admins read concierge"
  on public.concierge_requests for select to authenticated
  using (public.is_admin());

create policy "Admins update concierge"
  on public.concierge_requests for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- storage bucket for product images
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "Public read product images"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'product-images');

create policy "Vendors upload product images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'product-images'
    and (public.current_vendor_id() is not null or public.is_admin())
  );

create policy "Vendors update own product images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'product-images'
    and (public.current_vendor_id() is not null or public.is_admin())
  );

create policy "Vendors delete own product images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'product-images'
    and (public.current_vendor_id() is not null or public.is_admin())
  );
