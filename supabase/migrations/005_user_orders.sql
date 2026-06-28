-- Link orders to accounts + placeholder fields for Gig logistics API
alter table public.orders
  add column if not exists user_id uuid references auth.users (id) on delete set null,
  add column if not exists tracking_carrier text,
  add column if not exists tracking_number text,
  add column if not exists tracking_url text;

create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_buyer_email_idx on public.orders ((lower(buyer ->> 'email')));

-- Tighten reads: owners only (server uses service role for guest order pages)
drop policy if exists "Anyone can read orders" on public.orders;

create policy "Users read own orders"
  on public.orders for select to authenticated
  using (
    user_id = auth.uid()
    or lower(buyer ->> 'email') = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
