-- Product embeddings for semantic similarity (OpenAI text-embedding-3-small, 1536 dims)

create extension if not exists vector;

alter table public.products
  add column if not exists embedding vector(1536),
  add column if not exists embedding_updated_at timestamptz;

create index if not exists products_embedding_idx
  on public.products
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create or replace function public.match_similar_products(
  anchor_id uuid,
  match_count integer default 8
)
returns table (
  id uuid,
  similarity float
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    1 - (p.embedding <=> (select embedding from public.products where id = anchor_id)) as similarity
  from public.products p
  where p.id != anchor_id
    and p.status = 'live'
    and p.in_stock = true
    and p.embedding is not null
    and exists (select 1 from public.products a where a.id = anchor_id and a.embedding is not null)
  order by p.embedding <=> (select embedding from public.products where id = anchor_id)
  limit greatest(match_count, 1);
$$;

grant execute on function public.match_similar_products(uuid, integer) to authenticated, service_role;

create or replace function public.match_products_by_embedding(
  query_embedding vector(1536),
  match_count integer default 8
)
returns table (
  id uuid,
  similarity float
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    1 - (p.embedding <=> query_embedding) as similarity
  from public.products p
  where p.status = 'live'
    and p.in_stock = true
    and p.embedding is not null
  order by p.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;

grant execute on function public.match_products_by_embedding(vector, integer) to authenticated, service_role;
