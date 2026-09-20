-- Kay Kitchen requests: Kay delivery vs hub pickup (not Terminal)

alter table public.table_requests
  add column if not exists fulfillment_method text not null default 'delivery'
    check (fulfillment_method in ('delivery', 'pickup'));

alter table public.table_requests
  add column if not exists state text;

alter table public.table_requests
  add column if not exists pickup_hub_id uuid;

alter table public.table_requests
  add column if not exists pickup_hub_name text;

comment on column public.table_requests.fulfillment_method is
  'Kay delivery (manual) or pickup at a Kay hub — never Terminal carrier.';

comment on column public.table_requests.city is
  'Delivery city when fulfillment_method = delivery.';

comment on column public.table_requests.state is
  'Delivery state when fulfillment_method = delivery.';

comment on column public.table_requests.pickup_hub_name is
  'Snapshot of Kay hub name when customer chooses pickup.';
