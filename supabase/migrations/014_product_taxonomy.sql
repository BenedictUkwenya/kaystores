-- Product taxonomy: placement arrays documented (no schema change required).
-- occasions, recipients, collections, tags are text[] on public.products.
-- Vendors set occasions/recipients/collections; platform tags are admin-only.

comment on column public.products.occasions is
  'Nav slugs: birthday, anniversary, wedding, graduation, new-baby, thank-you';

comment on column public.products.recipients is
  'Nav slugs: for-her, for-him, for-parents, for-friends, for-kids, corporate-gifts';

comment on column public.products.collections is
  'Catalog lines: luxury, corporate';

comment on column public.products.tags is
  'Platform badges (admin): bestseller, new, exclusive, night_collection';
