-- Hub steps for Kay Kitchen and Concierge after payment, mirroring gift orders:
-- vendor sends to a Kay hub -> hub receives -> quality check -> out for delivery -> delivered.

alter table public.table_requests
  add column if not exists fulfilment_stage text not null default 'awaiting_vendor',
  add column if not exists dropoff_hub_id uuid,
  add column if not exists dropoff_hub_name text,
  add column if not exists dropoff_hub_phone text,
  add column if not exists dropoff_hub_address text,
  add column if not exists vendor_sent_at timestamptz,
  add column if not exists hub_received_at timestamptz,
  add column if not exists qc_passed_at timestamptz,
  add column if not exists qc_note text,
  add column if not exists out_for_delivery_at timestamptz,
  add column if not exists delivered_at timestamptz;

alter table public.concierge_requests
  add column if not exists fulfilment_stage text not null default 'awaiting_vendor',
  add column if not exists dropoff_hub_id uuid,
  add column if not exists dropoff_hub_name text,
  add column if not exists dropoff_hub_phone text,
  add column if not exists dropoff_hub_address text,
  add column if not exists vendor_sent_at timestamptz,
  add column if not exists hub_received_at timestamptz,
  add column if not exists qc_passed_at timestamptz,
  add column if not exists qc_note text,
  add column if not exists out_for_delivery_at timestamptz,
  add column if not exists delivered_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'table_requests_fulfilment_stage_check'
  ) then
    alter table public.table_requests
      add constraint table_requests_fulfilment_stage_check
      check (fulfilment_stage in ('awaiting_vendor','vendor_sent','at_hub','qc_passed','out_for_delivery','delivered'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'concierge_requests_fulfilment_stage_check'
  ) then
    alter table public.concierge_requests
      add constraint concierge_requests_fulfilment_stage_check
      check (fulfilment_stage in ('awaiting_vendor','vendor_sent','at_hub','qc_passed','out_for_delivery','delivered'));
  end if;
end $$;

-- Already-finished requests shouldn't show up as "waiting on vendor".
update public.table_requests
  set fulfilment_stage = 'delivered'
  where status = 'fulfilled' and fulfilment_stage = 'awaiting_vendor';

update public.concierge_requests
  set fulfilment_stage = 'delivered'
  where status = 'completed' and fulfilment_stage = 'awaiting_vendor';

update public.concierge_requests r
  set fulfilment_stage = 'vendor_sent'
  from public.concierge_vendor_assignments a
  where a.id = r.selected_assignment_id
    and a.fulfilment_status = 'at_hub'
    and r.fulfilment_stage = 'awaiting_vendor';

-- Why a gift item failed quality check, shown to the vendor.
alter table public.vendor_order_items
  add column if not exists qc_note text;
