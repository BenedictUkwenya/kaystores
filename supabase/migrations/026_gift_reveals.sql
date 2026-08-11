-- Gift Kay Reveal (QR → video/photo/text)

create table if not exists public.gift_reveals (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete cascade,
  token text not null unique,
  note text,
  video_path text,
  photo_path text,
  opened_at timestamptz,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gift_reveals_token_idx
  on public.gift_reveals (token);

create index if not exists gift_reveals_order_id_idx
  on public.gift_reveals (order_id);

alter table public.gift_reveals enable row level security;

-- Access only via service role / Next.js admin client (no direct client policies)

insert into storage.buckets (id, name, public)
values ('gift-reveal-media', 'gift-reveal-media', false)
on conflict (id) do nothing;

drop policy if exists "Admins read gift reveal media" on storage.objects;
create policy "Admins read gift reveal media"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'gift-reveal-media'
    and public.is_admin()
  );
