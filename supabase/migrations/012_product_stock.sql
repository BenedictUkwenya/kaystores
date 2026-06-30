-- Product stock quantity + atomic decrement on purchase

alter table public.products
  add column if not exists stock_quantity integer not null default 0
    check (stock_quantity >= 0);

-- Existing live products: treat in_stock=true as having stock (vendors can edit later)
update public.products
set stock_quantity = 99
where stock_quantity = 0 and in_stock = true;

update public.products
set stock_quantity = 0, in_stock = false
where in_stock = false;

-- Atomically reserve stock when an order is placed (aggregates duplicate product lines)
create or replace function public.reserve_product_stock(items jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  line record;
  remaining integer;
begin
  for line in
    select
      (x->>'product_id')::uuid as product_id,
      sum((x->>'quantity')::integer) as quantity
    from jsonb_array_elements(items) as x
    group by (x->>'product_id')::uuid
  loop
    update public.products
    set
      stock_quantity = stock_quantity - line.quantity,
      in_stock = (stock_quantity - line.quantity) > 0
    where id = line.product_id
      and status = 'live'
      and stock_quantity >= line.quantity
    returning stock_quantity into remaining;

    if not found then
      raise exception 'insufficient_stock:%', line.product_id;
    end if;
  end loop;
end;
$$;

grant execute on function public.reserve_product_stock(jsonb) to authenticated, service_role;

-- Restore stock if checkout fails after reservation
create or replace function public.restore_product_stock(items jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  line record;
begin
  for line in
    select
      (x->>'product_id')::uuid as product_id,
      sum((x->>'quantity')::integer) as quantity
    from jsonb_array_elements(items) as x
    group by (x->>'product_id')::uuid
  loop
    update public.products
    set
      stock_quantity = stock_quantity + line.quantity,
      in_stock = true
    where id = line.product_id;
  end loop;
end;
$$;

grant execute on function public.restore_product_stock(jsonb) to authenticated, service_role;
