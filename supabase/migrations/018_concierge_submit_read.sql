-- Allow clients to read back their own concierge row after insert (optional direct client reads)

create policy "Submitters read own concierge by email"
  on public.concierge_requests for select to authenticated
  using (
    lower(trim(contact_email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
  );
