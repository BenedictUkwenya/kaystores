-- User account status, role invites, admin profile management

create type public.account_status as enum ('active', 'suspended', 'blocked');

alter table public.profiles
  add column if not exists account_status public.account_status not null default 'active',
  add column if not exists status_reason text,
  add column if not exists status_changed_at timestamptz,
  add column if not exists status_changed_by uuid references auth.users (id) on delete set null;

create index if not exists profiles_account_status_idx on public.profiles (account_status);

-- ---------------------------------------------------------------------------
-- role_invites (admin + vendor registration invites)
-- ---------------------------------------------------------------------------
create type public.role_invite_type as enum ('admin', 'vendor');

create table if not exists public.role_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  invite_role public.role_invite_type not null,
  token text not null unique,
  invited_by uuid references auth.users (id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'expired', 'cancelled')),
  metadata jsonb not null default '{}',
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz,
  accepted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists role_invites_email_idx on public.role_invites (lower(email));
create index if not exists role_invites_token_idx on public.role_invites (token);
create index if not exists role_invites_status_idx on public.role_invites (status);

alter table public.role_invites enable row level security;

create policy "Admins manage role invites"
  on public.role_invites for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Admins may update any profile (role, account status)
create policy "Admins update all profiles"
  on public.profiles for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Redeem pending invites after signup
create or replace function public.redeem_role_invites_for_user(
  p_user_id uuid,
  p_email text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  inv record;
  v_business_name text;
begin
  for inv in
    select *
    from public.role_invites
    where lower(email) = lower(p_email)
      and status = 'pending'
      and expires_at > now()
    order by created_at asc
  loop
    if inv.invite_role = 'admin' then
      update public.profiles
      set role = 'admin', updated_at = now()
      where id = p_user_id;
    elsif inv.invite_role = 'vendor' then
      v_business_name := coalesce(inv.metadata ->> 'business_name', split_part(p_email, '@', 1));

      update public.profiles
      set role = 'vendor', updated_at = now()
      where id = p_user_id;

      insert into public.vendors (
        user_id,
        business_name,
        contact_name,
        contact_email,
        status,
        invite_token,
        invited_by,
        approved_at,
        approved_by
      )
      values (
        p_user_id,
        v_business_name,
        v_business_name,
        lower(p_email),
        'approved',
        inv.token,
        inv.invited_by,
        now(),
        inv.invited_by
      )
      on conflict (user_id) do update
      set
        status = 'approved',
        approved_at = coalesce(public.vendors.approved_at, now()),
        approved_by = coalesce(public.vendors.approved_by, inv.invited_by),
        invite_token = inv.token;
    end if;

    update public.role_invites
    set
      status = 'accepted',
      accepted_at = now(),
      accepted_by = p_user_id
    where id = inv.id;
  end loop;
end;
$$;

-- Extend signup trigger to redeem invites
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

  perform public.redeem_role_invites_for_user(new.id, new.email);

  return new;
end;
$$;
