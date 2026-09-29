-- Kay Kitchen: vendor submits a price; admin adds margin before quoting the client.
alter table public.table_requests
  add column if not exists vendor_quote_amount numeric,
  add column if not exists vendor_quote_note text,
  add column if not exists vendor_quoted_at timestamptz,
  -- Inspiration photos the client attached ({ name, path, contentType }[]),
  -- stored in the private concierge-attachments bucket under table/<id>/.
  add column if not exists reference_images jsonb not null default '[]'::jsonb;
