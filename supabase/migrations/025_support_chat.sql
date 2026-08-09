-- In-app support chat (customer/vendor ↔ admin)

create table if not exists public.support_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject text not null default 'Kay Support',
  status text not null default 'open'
    check (status in ('open', 'closed')),
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_threads_user_id_idx
  on public.support_threads (user_id);

create index if not exists support_threads_status_last_message_idx
  on public.support_threads (status, last_message_at desc);

-- At most one open thread per user
create unique index if not exists support_threads_one_open_per_user
  on public.support_threads (user_id)
  where status = 'open';

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.support_threads (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  sender_role text not null
    check (sender_role in ('customer', 'vendor', 'admin')),
  body text,
  image_path text,
  created_at timestamptz not null default now(),
  constraint support_messages_has_content
    check (
      (body is not null and length(trim(body)) > 0)
      or image_path is not null
    )
);

create index if not exists support_messages_thread_created_idx
  on public.support_messages (thread_id, created_at asc);

alter table public.support_threads enable row level security;
alter table public.support_messages enable row level security;

drop policy if exists "Users read own support threads" on public.support_threads;
create policy "Users read own support threads"
  on public.support_threads for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users insert own support threads" on public.support_threads;
create policy "Users insert own support threads"
  on public.support_threads for insert to authenticated
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users update own support threads" on public.support_threads;
create policy "Users update own support threads"
  on public.support_threads for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "Admins manage support threads" on public.support_threads;
create policy "Admins manage support threads"
  on public.support_threads for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Users read own support messages" on public.support_messages;
create policy "Users read own support messages"
  on public.support_messages for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.support_threads t
      where t.id = thread_id and t.user_id = auth.uid()
    )
  );

drop policy if exists "Users insert own support messages" on public.support_messages;
create policy "Users insert own support messages"
  on public.support_messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and (
      public.is_admin()
      or exists (
        select 1 from public.support_threads t
        where t.id = thread_id and t.user_id = auth.uid()
      )
    )
  );

drop policy if exists "Admins manage support messages" on public.support_messages;
create policy "Admins manage support messages"
  on public.support_messages for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('support-attachments', 'support-attachments', false)
on conflict (id) do nothing;

drop policy if exists "Users upload own support attachments" on storage.objects;
create policy "Users upload own support attachments"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'support-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users read own support attachments" on storage.objects;
create policy "Users read own support attachments"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'support-attachments'
    and (
      public.is_admin()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

drop policy if exists "Admins read support attachments" on storage.objects;
create policy "Admins read support attachments"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'support-attachments'
    and public.is_admin()
  );
