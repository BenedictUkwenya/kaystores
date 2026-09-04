-- Seed initial Kay hubs (idempotent on slug).

insert into public.shipping_hubs (
  name,
  slug,
  address,
  contact_name,
  contact_email,
  contact_phone,
  service_states,
  is_default,
  is_active,
  sort_order
)
values
  (
    'Kay Hub 1',
    'kay-hub-1',
    jsonb_build_object(
      'line1', 'Behind Eco Fitness Hub, Lokogoma',
      'city', 'Abuja',
      'state', 'FCT',
      'country', 'Nigeria'
    ),
    'Chris Junior Attah',
    'krisjnr7@gmail.com',
    '+2348080049217',
    array['Abuja', 'FCT', 'Kogi', 'Rivers', 'Port Harcourt', 'Lagos'],
    true,
    true,
    1
  ),
  (
    'Kay Hub 2',
    'kay-hub-2',
    jsonb_build_object(
      'line1', 'Federal University of Technology, Gidan Kwano',
      'city', 'Minna',
      'state', 'Niger',
      'country', 'Nigeria'
    ),
    'Chris Junior Attah',
    'krisjnr7@gmail.com',
    '+2348038233601',
    array['Niger'],
    false,
    true,
    2
  )
on conflict (slug) do update set
  name = excluded.name,
  address = excluded.address,
  contact_name = excluded.contact_name,
  contact_email = excluded.contact_email,
  contact_phone = excluded.contact_phone,
  service_states = excluded.service_states,
  is_default = excluded.is_default,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order,
  updated_at = now();
