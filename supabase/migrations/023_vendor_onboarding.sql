-- Vendor onboarding: invite modes + NIN for self-apply

alter table public.vendors
  add column if not exists nin text,
  add column if not exists onboarding_source text not null default 'self_apply';

alter table public.vendors
  drop constraint if exists vendors_onboarding_source_check;

alter table public.vendors
  add constraint vendors_onboarding_source_check
  check (onboarding_source in ('invite', 'self_apply'));

create index if not exists vendors_onboarding_source_idx
  on public.vendors (onboarding_source);

-- ---------------------------------------------------------------------------
-- role_invites (used by inviteUserByRole / redeem RPC)
-- ---------------------------------------------------------------------------
create table if not exists public.role_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  invite_role public.user_role not null,
  token uuid not null unique default gen_random_uuid(),
  invited_by uuid references auth.users (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists role_invites_email_idx
  on public.role_invites (lower(email));

create index if not exists role_invites_open_idx
  on public.role_invites (email)
  where accepted_at is null;

alter table public.role_invites enable row level security;

drop policy if exists "Admins manage role invites" on public.role_invites;

create policy "Admins manage role invites"
  on public.role_invites for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Redeem open invites for a user (by email match)
-- ---------------------------------------------------------------------------
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
  invite_mode text;
  biz_name text;
  v_id uuid;
begin
  if p_user_id is null or p_email is null or length(trim(p_email)) = 0 then
    return;
  end if;

  insert into public.profiles (id, role)
  values (p_user_id, 'customer')
  on conflict (id) do nothing;

  for inv in
    select *
    from public.role_invites
    where accepted_at is null
      and lower(trim(email)) = lower(trim(p_email))
    order by created_at asc
  loop
    if inv.invite_role = 'admin' then
      update public.profiles
      set role = 'admin', updated_at = now()
      where id = p_user_id;

    elsif inv.invite_role = 'vendor' then
      invite_mode := coalesce(inv.metadata ->> 'inviteMode', 'profile');
      biz_name := coalesce(
        nullif(trim(inv.metadata ->> 'business_name'), ''),
        split_part(inv.email, '@', 1)
      );

      select id into v_id
      from public.vendors
      where user_id = p_user_id
         or invite_token::text = inv.token::text
      limit 1;

      if v_id is null then
        insert into public.vendors (
          user_id,
          business_name,
          contact_name,
          contact_email,
          status,
          onboarding_source,
          invite_token,
          invited_by
        )
        values (
          p_user_id,
          biz_name,
          biz_name,
          lower(trim(p_email)),
          case when invite_mode = 'instant' then 'approved'::public.vendor_status else 'pending'::public.vendor_status end,
          'invite',
          case when invite_mode = 'instant' then null else inv.token::text end,
          inv.invited_by
        )
        returning id into v_id;

        if invite_mode = 'instant' then
          update public.vendors
          set
            approved_at = now(),
            approved_by = inv.invited_by,
            updated_at = now()
          where id = v_id;
        end if;
      else
        if invite_mode = 'instant' then
          update public.vendors
          set
            user_id = p_user_id,
            business_name = coalesce(nullif(business_name, ''), biz_name),
            contact_email = lower(trim(p_email)),
            status = 'approved',
            onboarding_source = 'invite',
            invite_token = null,
            invited_by = coalesce(invited_by, inv.invited_by),
            approved_at = coalesce(approved_at, now()),
            approved_by = coalesce(approved_by, inv.invited_by),
            updated_at = now()
          where id = v_id;
        else
          update public.vendors
          set
            user_id = p_user_id,
            onboarding_source = 'invite',
            invite_token = inv.token::text,
            invited_by = coalesce(invited_by, inv.invited_by),
            updated_at = now()
          where id = v_id;
        end if;
      end if;

      if invite_mode = 'instant' then
        update public.profiles
        set role = 'vendor', updated_at = now()
        where id = p_user_id;
      end if;
    end if;

    update public.role_invites
    set accepted_at = now()
    where id = inv.id;
  end loop;
end;
$$;

revoke all on function public.redeem_role_invites_for_user(uuid, text) from public;
grant execute on function public.redeem_role_invites_for_user(uuid, text) to service_role;
grant execute on function public.redeem_role_invites_for_user(uuid, text) to authenticated;
