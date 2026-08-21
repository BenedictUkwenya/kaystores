-- Structured catalog attributes, searchable keywords, vendor payout price, size options.

alter table public.products
  add column if not exists product_type text,
  add column if not exists master_category text,
  add column if not exists color text,
  add column if not exists condition text,
  add column if not exists audience text,
  add column if not exists search_keywords text[] not null default '{}',
  add column if not exists vendor_original_price integer
    check (vendor_original_price is null or vendor_original_price >= 0),
  add column if not exists size_options text[] not null default '{}';

comment on column public.products.product_type is 'Specific type e.g. Slide, Sneaker, Watch';
comment on column public.products.master_category is 'Broader group e.g. Footwear, Jewelry — powers general search';
comment on column public.products.vendor_original_price is 'Vendor payout unit price; independent of customer display/list price';
comment on column public.products.size_options is 'Available sizes for one listing (footwear/clothing); empty = no size picker';
comment on column public.products.search_keywords is 'Normalized searchable terms including synonyms for catalog discovery';

create index if not exists products_product_type_idx on public.products (product_type);
create index if not exists products_master_category_idx on public.products (master_category);
create index if not exists products_search_keywords_idx on public.products using gin (search_keywords);

-- Backfill payout price from existing vendor list price where missing.
update public.products
set vendor_original_price = price
where vendor_original_price is null
  and price is not null;
