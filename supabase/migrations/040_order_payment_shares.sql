-- Split cost: one order paid by several people via share links.

alter table public.orders
  add column if not exists payment_mode text not null default 'single',
  add column if not exists split_expires_at timestamptz;

alter table public.orders drop constraint if exists orders_payment_mode_check;
alter table public.orders
  add constraint orders_payment_mode_check
  check (payment_mode in ('single', 'split'));

create index if not exists orders_split_expiry_idx
  on public.orders (split_expires_at)
  where payment_mode = 'split';

create table if not exists public.order_payment_shares (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  share_index integer not null check (share_index >= 1),
  amount numeric(12, 2) not null check (amount > 0),
  token text not null unique,
  payer_name text,
  payer_email text,
  status text not null default 'unpaid'
    check (status in ('unpaid', 'pending', 'paid', 'void', 'refund_due', 'refunded')),
  payment_reference text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, share_index)
);

create index if not exists order_payment_shares_order_idx
  on public.order_payment_shares (order_id);

-- Service role only (public pages go through server routes).
alter table public.order_payment_shares enable row level security;
