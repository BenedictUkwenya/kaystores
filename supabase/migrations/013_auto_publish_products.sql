-- Trusted vendors: listings go live without manual admin review

update public.products
set
  status = 'live',
  rejection_reason = null,
  reviewed_at = coalesce(reviewed_at, now())
where status = 'pending_review';

drop policy if exists "Vendors insert own products" on public.products;

create policy "Vendors insert own products"
  on public.products for insert to authenticated
  with check (
    public.current_vendor_id() is not null
    and vendor_id = public.current_vendor_id()
    and status in ('draft', 'live')
    and (
      segment = 'gifting'
      or (segment = 'after_dark' and public.vendor_can_list_after_dark())
    )
  );
