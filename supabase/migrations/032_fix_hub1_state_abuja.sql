-- Fix Kay Hub 1 state to Terminal-valid "Abuja" (not FCT).

update public.shipping_hubs
set
  address = jsonb_set(address, '{state}', '"Abuja"', true),
  updated_at = now()
where slug = 'kay-hub-1'
  and coalesce(address->>'state', '') <> 'Abuja';
