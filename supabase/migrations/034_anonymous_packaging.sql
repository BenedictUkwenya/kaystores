-- Anonymous packaging available for all orders (gifting + After Dark).
alter table public.orders
  add column if not exists anonymous_packaging boolean not null default false;

comment on column public.orders.anonymous_packaging is
  'When true, ship in plain outer wrap with no product names on the outside.';
