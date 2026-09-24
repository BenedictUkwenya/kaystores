-- Vendor → hub dispatch: hub choice, attach phone, dispatch timestamp, 12h reminder.

alter table public.vendor_order_items
  add column if not exists selected_hub_id uuid,
  add column if not exists selected_hub_name text,
  add column if not exists selected_hub_phone text,
  add column if not exists selected_hub_address jsonb,
  add column if not exists hub_selected_at timestamptz,
  add column if not exists vendor_dispatched_at timestamptz,
  add column if not exists hub_reminder_sent_at timestamptz;

create index if not exists vendor_order_items_selected_hub_idx
  on public.vendor_order_items (selected_hub_id)
  where selected_hub_id is not null;

create index if not exists vendor_order_items_hub_reminder_idx
  on public.vendor_order_items (fulfillment_status, updated_at)
  where fulfillment_status = 'awaiting_hub_delivery';

comment on column public.vendor_order_items.selected_hub_phone is
  'Hub phone vendors attach on the parcel so Kay is notified on arrival.';
comment on column public.vendor_order_items.vendor_dispatched_at is
  'When the vendor marked the parcel as sent/dispatched to the hub.';
