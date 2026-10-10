-- Kay feedback board. Signed-in shoppers can post, vote, and comment.
-- Admins set the status and the official reply. Triggers keep authorship honest.

create or replace function public.feedback_display_name(p_user uuid)
returns text
language sql
stable
security definer
set search_path to 'public'
as $$
  select coalesce((
    select nullif(trim(
      split_part(trim(p.full_name), ' ', 1) ||
      case
        when split_part(trim(p.full_name), ' ', 2) <> ''
          then ' ' || upper(left(split_part(trim(p.full_name), ' ', 2), 1)) || '.'
        else ''
      end
    ), '')
    from public.profiles p
    where p.id = p_user
    limit 1
  ), 'Kay client');
$$;

create table if not exists public.feedback_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  author_name text not null default 'Kay client',
  category text not null check (category in ('idea', 'bug', 'tip', 'praise')),
  title text not null check (char_length(title) between 3 and 120),
  body text not null default '' check (char_length(body) <= 4000),
  screenshot_path text,
  status text not null default 'open'
    check (status in ('open', 'under_review', 'planned', 'in_progress', 'done', 'declined')),
  staff_reply text check (staff_reply is null or char_length(staff_reply) <= 4000),
  staff_reply_by uuid references auth.users (id) on delete set null,
  staff_reply_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_feedback_posts_created on public.feedback_posts (created_at desc);

create table if not exists public.feedback_votes (
  post_id uuid not null references public.feedback_posts (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.feedback_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.feedback_posts (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  author_name text not null default 'Kay client',
  is_staff boolean not null default false,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists idx_feedback_comments_post on public.feedback_comments (post_id, created_at);

create or replace function public.feedback_posts_guard()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_staff boolean := public.is_admin();
begin
  if tg_op = 'INSERT' then
    new.user_id := coalesce(auth.uid(), new.user_id);
    new.author_name := public.feedback_display_name(new.user_id);
    new.status := 'open';
    new.staff_reply := null;
    new.staff_reply_by := null;
    new.staff_reply_at := null;
    new.created_at := now();
    new.updated_at := now();
    return new;
  end if;

  new.id := old.id;
  new.user_id := old.user_id;
  new.author_name := old.author_name;
  new.created_at := old.created_at;
  new.updated_at := now();
  if v_staff then
    if new.staff_reply is distinct from old.staff_reply then
      new.staff_reply_by := auth.uid();
      new.staff_reply_at := now();
    else
      new.staff_reply_by := old.staff_reply_by;
      new.staff_reply_at := old.staff_reply_at;
    end if;
  else
    new.status := old.status;
    new.staff_reply := old.staff_reply;
    new.staff_reply_by := old.staff_reply_by;
    new.staff_reply_at := old.staff_reply_at;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_feedback_posts_guard on public.feedback_posts;
create trigger trg_feedback_posts_guard
  before insert or update on public.feedback_posts
  for each row execute function public.feedback_posts_guard();

create or replace function public.feedback_comments_guard()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  new.user_id := coalesce(auth.uid(), new.user_id);
  new.author_name := public.feedback_display_name(new.user_id);
  new.is_staff := public.is_admin();
  if new.is_staff then
    new.author_name := 'Kay Stores';
  end if;
  new.created_at := now();
  return new;
end;
$$;

drop trigger if exists trg_feedback_comments_guard on public.feedback_comments;
create trigger trg_feedback_comments_guard
  before insert on public.feedback_comments
  for each row execute function public.feedback_comments_guard();

alter table public.feedback_posts enable row level security;
alter table public.feedback_votes enable row level security;
alter table public.feedback_comments enable row level security;

drop policy if exists feedback_posts_read on public.feedback_posts;
create policy feedback_posts_read on public.feedback_posts
  for select to authenticated using (true);
drop policy if exists feedback_posts_insert on public.feedback_posts;
create policy feedback_posts_insert on public.feedback_posts
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists feedback_posts_update on public.feedback_posts;
create policy feedback_posts_update on public.feedback_posts
  for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
drop policy if exists feedback_posts_delete on public.feedback_posts;
create policy feedback_posts_delete on public.feedback_posts
  for delete to authenticated using (user_id = auth.uid() or public.is_admin());

drop policy if exists feedback_votes_read on public.feedback_votes;
create policy feedback_votes_read on public.feedback_votes
  for select to authenticated using (true);
drop policy if exists feedback_votes_insert on public.feedback_votes;
create policy feedback_votes_insert on public.feedback_votes
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists feedback_votes_delete on public.feedback_votes;
create policy feedback_votes_delete on public.feedback_votes
  for delete to authenticated using (user_id = auth.uid());

drop policy if exists feedback_comments_read on public.feedback_comments;
create policy feedback_comments_read on public.feedback_comments
  for select to authenticated using (true);
drop policy if exists feedback_comments_insert on public.feedback_comments;
create policy feedback_comments_insert on public.feedback_comments
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists feedback_comments_delete on public.feedback_comments;
create policy feedback_comments_delete on public.feedback_comments
  for delete to authenticated using (user_id = auth.uid() or public.is_admin());

grant select, insert, update, delete on public.feedback_posts to authenticated;
grant select, insert, delete on public.feedback_votes to authenticated;
grant select, insert, delete on public.feedback_comments to authenticated;
grant all on public.feedback_posts, public.feedback_votes, public.feedback_comments to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'feedback-screenshots',
  'feedback-screenshots',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
on conflict (id) do nothing;

drop policy if exists feedback_shots_insert on storage.objects;
create policy feedback_shots_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'feedback-screenshots'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists feedback_shots_read on storage.objects;
create policy feedback_shots_read on storage.objects
  for select to authenticated
  using (bucket_id = 'feedback-screenshots');

drop policy if exists feedback_shots_delete on storage.objects;
create policy feedback_shots_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'feedback-screenshots'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );
