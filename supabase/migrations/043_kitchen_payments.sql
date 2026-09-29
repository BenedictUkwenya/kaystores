-- Kay Kitchen: customers accept + pay the quote online; richer brief for the baker.

alter table public.table_requests
  add column if not exists payment_status text not null default 'unpaid',
  add column if not exists payment_reference text,
  add column if not exists paid_at timestamptz,
  add column if not exists delivery_address text,
  add column if not exists recipient_name text,
  add column if not exists recipient_phone text,
  add column if not exists allergies text,
  add column if not exists message_on_item text;

alter table public.table_requests
  drop constraint if exists table_requests_payment_status_check;
alter table public.table_requests
  add constraint table_requests_payment_status_check
  check (payment_status in ('unpaid', 'pending', 'paid', 'refunded'));

-- Kay Concierge: where Kay delivers once the item passes hub QC.
alter table public.concierge_requests
  add column if not exists delivery_address jsonb,
  add column if not exists recipient_name text,
  add column if not exists recipient_phone text;
