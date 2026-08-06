-- Concierge reference file storage

alter table public.concierge_requests
  add column if not exists attachments jsonb not null default '[]';

insert into storage.buckets (id, name, public)
values ('concierge-attachments', 'concierge-attachments', false)
on conflict (id) do nothing;

drop policy if exists "Admins read concierge attachments" on storage.objects;
create policy "Admins read concierge attachments"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'concierge-attachments'
    and public.is_admin()
  );
