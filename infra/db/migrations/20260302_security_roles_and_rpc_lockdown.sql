-- Least-privilege roles and Data API lockdown for TlamaSite objects.

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'tlamasite_api') then
    create role tlamasite_api nologin nosuperuser nocreatedb nocreaterole noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'tlamasite_maintenance') then
    create role tlamasite_maintenance nologin nosuperuser nocreatedb nocreaterole noinherit;
  end if;
end $$;

grant usage on schema public to tlamasite_api, tlamasite_maintenance;

-- Existing Supabase projects auto-grant function execution. Revoke every
-- TlamaSite routine, including production overloads not represented locally.
do $$
declare
  routine record;
  restricted_role text;
begin
  for routine in
    select p.oid::regprocedure as identity, p.prosecdef as security_definer
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and (
        p.proname like 'catalog\_%' escape '\'
        or p.proname like 'refresh\_catalog\_%' escape '\'
        or p.proname like 'refresh\_canonical\_%' escape '\'
        or p.proname like 'rebuild\_catalog\_%' escape '\'
        or p.proname like 'record\_catalog\_%' escape '\'
        or p.proname in (
          'apply_catalog_presentation_fallback',
          'canonical_product_slug',
          'extract_category_tags',
          'normalize_alias_ean',
          'seller_priority'
        )
      )
  loop
    if routine.security_definer then
      execute format(
        'alter function %s set search_path to %L',
        routine.identity,
        ''
      );
    end if;
    execute format('revoke execute on function %s from public', routine.identity);
    foreach restricted_role in array array['anon', 'authenticated'] loop
      if exists (select 1 from pg_roles where rolname = restricted_role) then
        execute format(
          'revoke execute on function %s from %I',
          routine.identity,
          restricted_role
        );
      end if;
    end loop;
    execute format(
      'grant execute on function %s to tlamasite_maintenance',
      routine.identity
    );
  end loop;
end $$;

-- Anonymous Data API roles must not retain grants left by older migrations or
-- dashboard changes on any catalog, alias, or snapshot relation.
do $$
declare
  catalog_relation record;
  restricted_role text;
begin
  for catalog_relation in
    select c.oid::regclass as identity
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p', 'v', 'm', 'f')
      and (
        c.relname like 'catalog\_%' escape '\'
        or c.relname like 'canonical\_%' escape '\'
        or c.relname like 'product\_price\_snapshots%' escape '\'
      )
  loop
    execute format(
      'revoke all privileges on table %s from public',
      catalog_relation.identity
    );
    foreach restricted_role in array array['anon', 'authenticated'] loop
      if exists (select 1 from pg_roles where rolname = restricted_role) then
        execute format(
          'revoke all privileges on table %s from %I',
          catalog_relation.identity,
          restricted_role
        );
      end if;
    end loop;
  end loop;
end $$;

-- Supabase migrations run as postgres. New functions are private until a
-- migration explicitly grants them to an application role.
alter default privileges for role postgres in schema public
  revoke execute on functions from public;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated;

grant select on table
  public.catalog_slug_state,
  public.catalog_slug_seller_state,
  public.catalog_daily_price_history,
  public.canonical_product_aliases,
  public.catalog_slug_summary,
  public.catalog_slug_seller_summary
to tlamasite_api;

grant execute on function public.canonical_product_slug(text, text, text)
to tlamasite_api;

grant select on table public.product_price_snapshots
to tlamasite_maintenance;

-- Older installations may still retain the pre-cutover snapshot table.
do $$
begin
  if to_regclass('public.product_price_snapshots_partitioned') is not null then
    execute 'grant select on table public.product_price_snapshots_partitioned '
      || 'to tlamasite_maintenance';
  end if;
end $$;
grant select, insert, update, delete on table
  public.catalog_slug_state,
  public.catalog_slug_seller_state,
  public.catalog_daily_price_history,
  public.canonical_products,
  public.canonical_product_aliases,
  public.canonical_product_alias_candidates
to tlamasite_maintenance;
grant usage, select on sequence public.canonical_product_alias_candidates_id_seq
to tlamasite_maintenance;

-- The anonymous build client needs only these public read models.
revoke all on table public.catalog_slug_state from anon, authenticated;
revoke all on table public.catalog_slug_seller_state from anon, authenticated;
grant select on table public.catalog_slug_state to anon;
grant select on table public.catalog_slug_seller_state to anon;

alter table public.catalog_slug_state enable row level security;
alter table public.catalog_slug_seller_state enable row level security;

drop policy if exists catalog_slug_state_public_read on public.catalog_slug_state;
create policy catalog_slug_state_public_read
on public.catalog_slug_state for select
to anon, tlamasite_api
using (true);

drop policy if exists catalog_slug_state_maintenance on public.catalog_slug_state;
create policy catalog_slug_state_maintenance
on public.catalog_slug_state for all
to tlamasite_maintenance
using (true)
with check (true);

drop policy if exists catalog_seller_state_public_read
on public.catalog_slug_seller_state;
create policy catalog_seller_state_public_read
on public.catalog_slug_seller_state for select
to anon, tlamasite_api
using (true);

drop policy if exists catalog_seller_state_maintenance
on public.catalog_slug_seller_state;
create policy catalog_seller_state_maintenance
on public.catalog_slug_seller_state for all
to tlamasite_maintenance
using (true)
with check (true);

-- Keep trusted service-role refresh callers working through the explicit
-- maintenance capability rather than public function grants.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant tlamasite_maintenance to service_role;
  end if;
end $$;
