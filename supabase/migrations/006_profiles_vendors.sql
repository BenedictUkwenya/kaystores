-- Profiles, vendors, product moderation fields

create type public.user_role as enum ('customer', 'vendor', 'admin');
create type public.vendor_status as enum ('pending', 'approved', 'suspended', 'rejected');
create type public.product_status as enum (
  'draft',
  'pending_review',
  'live',
  'rejected',
  'archived'
);
create type public.catalog_segment as enum ('gifting', 'after_dark');

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'customer',
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);

alter table public.profiles enable row level security;

create policy "Users read own profile"
  on public.profiles for select to authenticated
  using (id = auth.uid());

create policy "Users update own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select p.role from public.profiles p where p.id = auth.uid()));

create policy "Users insert own profile"
  on public.profiles for insert to authenticated
  with check (id = auth.uid() and role = 'customer');

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- vendors
-- ---------------------------------------------------------------------------
create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  business_name text not null,
  contact_name text not null,
  contact_email text not null,
  contact_phone text not null default '',
  catalog_description text not null default '',
  status public.vendor_status not null default 'pending',
  can_list_after_dark boolean not null default false,
  bank_name text,
  account_number text,
  account_name text,
  invite_token text unique,
  invited_by uuid references auth.users (id) on delete set null,
  approved_at timestamptz,
  approved_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vendors_user_id_idx on public.vendors (user_id);
create index if not exists vendors_status_idx on public.vendors (status);
create index if not exists vendors_invite_token_idx on public.vendors (invite_token)
  where invite_token is not null;

alter table public.vendors enable row level security;

-- ---------------------------------------------------------------------------
-- extend products
-- ---------------------------------------------------------------------------
alter table public.products
  add column if not exists vendor_id uuid references public.vendors (id) on delete set null,
  add column if not exists status public.product_status not null default 'live',
  add column if not exists rejection_reason text,
  add column if not exists submitted_at timestamptz,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users (id) on delete set null,
  add column if not exists segment public.catalog_segment not null default 'gifting';

create index if not exists products_vendor_id_idx on public.products (vendor_id);
create index if not exists products_status_idx on public.products (status);
create index if not exists products_segment_idx on public.products (segment);

-- Backfill existing seed products as Kay-owned live listings
update public.products
set status = 'live', segment = 'gifting'
where status is null or vendor_id is null;

update public.products
set segment = 'after_dark'
where collections @> array['after-dark']::text[]
   or tags && array['night_collection', 'exclusive']::text[];

-- ---------------------------------------------------------------------------
-- helpers
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.current_vendor_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select v.id from public.vendors v
  where v.user_id = auth.uid() and v.status = 'approved'
  limit 1;
$$;

create or replace function public.vendor_can_list_after_dark()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select v.can_list_after_dark from public.vendors v
     where v.user_id = auth.uid() and v.status = 'approved'),
    false
  );
$$;
