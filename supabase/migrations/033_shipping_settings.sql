-- Global shipping mode: Terminal live rates and/or manual Kay delivery.

create table if not exists public.shipping_settings (
  id integer primary key default 1 check (id = 1),
  terminal_enabled boolean not null default true,
  manual_enabled boolean not null default true,
  manual_fee integer not null default 0 check (manual_fee >= 0),
  manual_label text not null default 'Kay delivery',
  manual_eta text,
  updated_at timestamptz not null default now()
);

insert into public.shipping_settings (id, terminal_enabled, manual_enabled, manual_fee, manual_label, manual_eta)
values (
  1,
  true,
  true,
  0,
  'Kay delivery',
  'Kay arranges delivery after quality checks'
)
on conflict (id) do nothing;

alter table public.shipping_settings enable row level security;

comment on table public.shipping_settings is
  'Single-row shipping mode: Terminal rates and/or manual Kay delivery offered at checkout.';
