-- Order pricing breakdown (MOV, curation fees, delivery, tax)
alter table public.orders
  add column if not exists pricing jsonb;

-- Backfill subtotal from pricing when present
comment on column public.orders.pricing is 'Kay curation fee breakdown: productSubtotal, curationFeeTotal, deliveryFee, tax, grandTotal, segments';
