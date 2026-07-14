-- Read-only deployment gate. Every query must return zero rows.

select routine_schema, routine_name, grantee
from information_schema.routine_privileges
where routine_schema = 'public'
  and grantee in ('PUBLIC', 'anon', 'authenticated')
  and (
    routine_name like 'catalog\_%' escape '\'
    or routine_name like 'refresh\_catalog\_%' escape '\'
    or routine_name like 'refresh\_canonical\_%' escape '\'
    or routine_name like 'rebuild\_catalog\_%' escape '\'
    or routine_name like 'record\_catalog\_%' escape '\'
    or routine_name in (
      'apply_catalog_presentation_fallback',
      'canonical_product_slug',
      'extract_category_tags',
      'normalize_alias_ean',
      'seller_priority'
    )
  );

select grantee, table_name, privilege_type
from information_schema.table_privileges
where table_schema = 'public'
  and grantee in ('PUBLIC', 'anon', 'authenticated')
  and (
    table_name like 'catalog\_%' escape '\'
    or table_name like 'canonical\_%' escape '\'
    or table_name like 'product\_price\_snapshots%' escape '\'
  )
  and not (
    grantee = 'anon'
    and table_name in ('catalog_slug_state', 'catalog_slug_seller_state')
    and privilege_type = 'SELECT'
  );

select table_name, privilege_type
from information_schema.table_privileges
where table_schema = 'public'
  and grantee = 'tlamasite_api'
  and (
    privilege_type <> 'SELECT'
    or table_name not in (
      'catalog_slug_state',
      'catalog_slug_seller_state',
      'catalog_daily_price_history',
      'canonical_product_aliases',
      'catalog_slug_summary',
      'catalog_slug_seller_summary'
    )
  );

select forbidden_relation
from (values
  ('public.product_price_snapshots'),
  ('public.product_price_snapshots_partitioned'),
  ('public.canonical_products'),
  ('public.canonical_product_alias_candidates')
) as forbidden(forbidden_relation)
where to_regclass(forbidden_relation) is not null
  and has_table_privilege(
    'tlamasite_api',
    to_regclass(forbidden_relation),
    'SELECT,INSERT,UPDATE,DELETE'
  );

select tablename
from pg_tables
where schemaname = 'public'
  and tablename in ('catalog_slug_state', 'catalog_slug_seller_state')
  and not rowsecurity;
