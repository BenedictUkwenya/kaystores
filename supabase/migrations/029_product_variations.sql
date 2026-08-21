-- Flexible per-product variations (one axis: Size, Length, Storage, etc.)

alter table public.products
  add column if not exists variation jsonb;

comment on column public.products.variation is
  'Optional single variation axis: { label, options: [{ id, label, stock }] }. Empty/null = no picker.';

-- Move legacy size_options into variation when variation is empty.
update public.products
set variation = jsonb_build_object(
  'label', 'Size',
  'options', (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', lower(regexp_replace(s, '\s+', '-', 'g')),
          'label', s,
          'stock', greatest(coalesce(stock_quantity, 0), 0)
        )
      ),
      '[]'::jsonb
    )
    from unnest(size_options) as s
  )
)
where variation is null
  and coalesce(cardinality(size_options), 0) > 0;
