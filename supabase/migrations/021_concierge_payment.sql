-- Concierge Flutterwave payment tracking

alter table public.concierge_requests
  add column if not exists payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'pending', 'paid', 'refunded')),
  add column if not exists payment_reference text,
  add column if not exists payment_amount integer,
  add column if not exists paid_at timestamptz;

create index if not exists concierge_requests_payment_status_idx
  on public.concierge_requests (payment_status);
