-- Admin presents one offer to client; client accepts, revises, or cancels

alter table public.concierge_requests
  add column if not exists recommended_assignment_id uuid
    references public.concierge_vendor_assignments (id) on delete set null,
  add column if not exists recommended_at timestamptz,
  add column if not exists client_feedback text not null default '',
  add column if not exists client_response text not null default 'none'
    check (client_response in ('none', 'pending', 'accepted', 'needs_revision', 'cancelled'));

alter table public.concierge_requests
  alter column auto_release_offers set default false;

create index if not exists concierge_requests_recommended_idx
  on public.concierge_requests (recommended_assignment_id);
