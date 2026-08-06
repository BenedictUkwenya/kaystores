-- Link concierge requests to authenticated users for account tracking

alter table public.concierge_requests
  add column if not exists user_id uuid references auth.users (id) on delete set null;

create index if not exists concierge_requests_user_id_idx
  on public.concierge_requests (user_id);

-- Normalize stored emails for reliable lookups
update public.concierge_requests
set contact_email = lower(trim(contact_email))
where contact_email <> lower(trim(contact_email));

-- Backfill user_id where contact email matches auth email
update public.concierge_requests cr
set user_id = u.id
from auth.users u
where cr.user_id is null
  and lower(trim(cr.contact_email)) = lower(trim(u.email));
