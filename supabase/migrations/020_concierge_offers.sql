-- Concierge offer selection: client picks vendor, fulfilment tracking

alter table public.concierge_requests
  add column if not exists selected_assignment_id uuid
    references public.concierge_vendor_assignments (id) on delete set null,
  add column if not exists client_selected_at timestamptz,
  add column if not exists offers_released_at timestamptz,
  add column if not exists auto_release_offers boolean not null default true,
  add column if not exists contact_released_at timestamptz;

alter table public.concierge_vendor_assignments
  add column if not exists offer_images jsonb not null default '[]',
  add column if not exists published_to_client boolean not null default false,
  add column if not exists outcome text not null default 'pending'
    check (outcome in ('pending', 'published', 'selected', 'not_chosen')),
  add column if not exists fulfilment_status text not null default 'pending'
    check (fulfilment_status in ('pending', 'sourcing', 'at_hub', 'completed'));

create index if not exists concierge_requests_status_idx
  on public.concierge_requests (status);

create index if not exists concierge_vendor_assignments_outcome_idx
  on public.concierge_vendor_assignments (outcome);
