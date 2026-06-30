-- Alias-aware incremental catalog state refresh.

alter table public.catalog_slug_seller_state
  add column if not exists genre_tags text[],
  add column if not exists game_type_tags text[],
  add column if not exists mechanic_tags text[],
  add column if not exists availability_status text,
  add column if not exists is_available boolean,
  add column if not exists is_preorder boolean,
  add column if not exists min_age integer,
  add column if not exists min_players integer,
  add column if not exists max_players integer,
  add column if not exists min_playtime_minutes integer,
  add column if not exists max_playtime_minutes integer,
  add column if not exists ean_codes text[],
  add column if not exists manufacturer text,
  add column if not exists price_movement text,
  add column if not exists boardgamegeek_rating numeric,
  add column if not exists is_discounted boolean;

alter table public.catalog_slug_state
  add column if not exists genre_tags text[],
  add column if not exists game_type_tags text[],
  add column if not exists mechanic_tags text[],
  add column if not exists availability_status text,
  add column if not exists min_age integer,
  add column if not exists min_players integer,
  add column if not exists max_players integer,
  add column if not exists min_playtime_minutes integer,
  add column if not exists max_playtime_minutes integer,
  add column if not exists ean_codes text[],
  add column if not exists manufacturer text,
  add column if not exists price_movement text,
  add column if not exists boardgamegeek_rating numeric,
  add column if not exists is_discounted boolean;

create or replace function public.refresh_catalog_state_incremental(
  p_since timestamptz default null
) returns jsonb
language plpgsql
as $$
declare
  v_changed_slug_count bigint := 0;
  v_upserted_seller_rows bigint := 0;
  v_deleted_seller_rows bigint := 0;
  v_upserted_slug_rows bigint := 0;
  v_deleted_slug_rows bigint := 0;
  v_deleted_stale_seller_rows bigint := 0;
  v_deleted_stale_slug_rows bigint := 0;
begin
  create temp table tmp_changed_slugs (
    product_name_normalized text primary key
  ) on commit drop;

  insert into tmp_changed_slugs (product_name_normalized)
  select distinct public.canonical_product_slug(
    s.seller,
    s.product_code,
    s.product_name_normalized
  )
  from public.product_price_snapshots s
  where s.product_name_normalized is not null
    and trim(s.product_name_normalized) <> ''
    and (p_since is null or s.scraped_at >= p_since);

  select count(*) into v_changed_slug_count from tmp_changed_slugs;
  if v_changed_slug_count = 0 then
    return jsonb_build_object(
      'changed_slugs', 0,
      'upserted_seller_rows', 0,
      'deleted_seller_rows', 0,
      'upserted_slug_rows', 0,
      'deleted_slug_rows', 0,
      'deleted_stale_seller_rows', 0,
      'deleted_stale_slug_rows', 0
    );
  end if;

  create temp table tmp_changed_source_slugs (
    product_name_normalized text primary key
  ) on commit drop;

  insert into tmp_changed_source_slugs (product_name_normalized)
  select distinct lower(trim(s.product_name_normalized))
  from public.product_price_snapshots s
  where s.product_name_normalized is not null
    and trim(s.product_name_normalized) <> ''
    and (p_since is null or s.scraped_at >= p_since)
  union
  select lower(trim(alias.product_name_normalized))
  from public.canonical_product_aliases alias
  join tmp_changed_slugs changed
    on changed.product_name_normalized = alias.canonical_product_id
  where alias.product_name_normalized is not null
    and trim(alias.product_name_normalized) <> '';

  analyze tmp_changed_slugs;
  analyze tmp_changed_source_slugs;

  create temp table tmp_seller_state_delta on commit drop as
  with base as (
    select
      p.id,
      public.canonical_product_slug(
        p.seller,
        p.product_code,
        p.product_name_normalized
      ) as product_name_normalized,
      lower(coalesce(nullif(trim(p.seller), ''), 'unknown')) as seller,
      p.product_guid,
      p.product_code,
      p.product_name_original as product_name,
      p.price_with_vat,
      p.list_price_with_vat,
      p.currency_code,
      p.availability_label,
      p.stock_status_label,
      p.source_url,
      p.scraped_at,
      p.metadata,
      p.hero_image_url,
      p.gallery_image_urls,
      p.short_description,
      p.supplementary_parameters,
      p.category_tags,
      p.genre_tags,
      p.game_type_tags,
      p.mechanic_tags,
      coalesce(
        nullif(p.availability_status, 'unknown'),
        public.catalog_availability_status(p.availability_label),
        'unknown'
      ) as availability_status,
      p.is_available,
      p.is_preorder,
      p.min_age,
      p.min_players,
      p.max_players,
      p.min_playtime_minutes,
      p.max_playtime_minutes,
      p.ean_codes,
      p.manufacturer,
      p.boardgamegeek_rating
    from public.product_price_snapshots p
    join tmp_changed_source_slugs source_slug
      on p.product_name_normalized = source_slug.product_name_normalized
    join tmp_changed_slugs changed
      on changed.product_name_normalized = public.canonical_product_slug(
        p.seller,
        p.product_code,
        p.product_name_normalized
      )
    where p.product_name_normalized is not null
      and trim(p.product_name_normalized) <> ''
  ),
  ranked as (
    select
      b.*,
      row_number() over (
        partition by b.product_name_normalized, b.seller
        order by b.scraped_at desc, b.id desc
      ) as rn_desc,
      row_number() over (
        partition by b.product_name_normalized, b.seller
        order by b.scraped_at asc, b.id asc
      ) as rn_asc,
      count(*) over (
        partition by b.product_name_normalized, b.seller
      ) as snapshot_count
    from base b
  ),
  latest as (select * from ranked where rn_desc = 1),
  previous_different as (
    select distinct on (b.product_name_normalized, b.seller)
      b.product_name_normalized,
      b.seller,
      b.price_with_vat as previous_price
    from base b
    join latest l using (product_name_normalized, seller)
    where (b.scraped_at, b.id) < (l.scraped_at, l.id)
      and b.price_with_vat is distinct from l.price_with_vat
    order by b.product_name_normalized, b.seller, b.scraped_at desc, b.id desc
  ),
  first_price as (
    select product_name_normalized, seller, price_with_vat as first_price
    from ranked
    where rn_asc = 1
  ),
  price_points as (
    select
      product_name_normalized,
      seller,
      jsonb_agg(
        jsonb_build_object(
          'rawDate',
          to_char((scraped_at at time zone 'UTC'), 'YYYY-MM-DD'),
          'price',
          price_with_vat
        )
        order by scraped_at
      ) as price_points
    from base
    group by product_name_normalized, seller
  )
  select
    l.product_name_normalized,
    l.seller,
    l.product_guid,
    l.product_code,
    l.product_name,
    unaccent(lower(l.product_name)) as product_name_search,
    l.currency_code,
    l.availability_label,
    l.stock_status_label,
    l.price_with_vat as latest_price,
    pd.previous_price,
    fp.first_price,
    l.list_price_with_vat,
    l.source_url,
    l.scraped_at as latest_scraped_at,
    l.hero_image_url,
    l.gallery_image_urls,
    l.short_description,
    l.supplementary_parameters,
    l.metadata,
    l.category_tags,
    l.genre_tags,
    l.game_type_tags,
    l.mechanic_tags,
    l.availability_status,
    l.is_available or l.availability_status = 'available' as is_available,
    l.is_preorder or l.availability_status = 'preorder' as is_preorder,
    l.min_age,
    l.min_players,
    l.max_players,
    l.min_playtime_minutes,
    l.max_playtime_minutes,
    l.ean_codes,
    l.manufacturer,
    l.boardgamegeek_rating,
    case
      when l.snapshot_count = 1 then 'new'
      when pd.previous_price is null then 'unchanged'
      when l.list_price_with_vat is not null
        and l.price_with_vat = l.list_price_with_vat
        and pd.previous_price < l.price_with_vat then 'back_to_list_price'
      when l.price_with_vat > pd.previous_price then 'increased'
      when l.price_with_vat < pd.previous_price then 'decreased'
      else 'unchanged'
    end as price_movement,
    coalesce(ppt.price_points, '[]'::jsonb) as price_points
  from latest l
  left join previous_different pd using (product_name_normalized, seller)
  left join first_price fp using (product_name_normalized, seller)
  left join price_points ppt using (product_name_normalized, seller);

  insert into public.catalog_slug_seller_state (
    product_name_normalized, seller, product_guid, product_code, product_name, product_name_search,
    currency_code, availability_label, stock_status_label, latest_price, previous_price, first_price,
    list_price_with_vat, source_url, latest_scraped_at, hero_image_url, gallery_image_urls,
    short_description, supplementary_parameters, metadata, category_tags, genre_tags, game_type_tags,
    mechanic_tags, availability_status, is_available, is_preorder, min_age, min_players, max_players,
    min_playtime_minutes, max_playtime_minutes, ean_codes, manufacturer, boardgamegeek_rating,
    price_movement, price_points
  )
  select
    product_name_normalized, seller, product_guid, product_code, product_name, product_name_search,
    currency_code, availability_label, stock_status_label, latest_price, previous_price, first_price,
    list_price_with_vat, source_url, latest_scraped_at, hero_image_url, gallery_image_urls,
    short_description, supplementary_parameters, metadata, category_tags, genre_tags, game_type_tags,
    mechanic_tags, availability_status, is_available, is_preorder, min_age, min_players, max_players,
    min_playtime_minutes, max_playtime_minutes, ean_codes, manufacturer, boardgamegeek_rating,
    price_movement, price_points
  from tmp_seller_state_delta
  on conflict (product_name_normalized, seller) do update set
    product_guid = excluded.product_guid, product_code = excluded.product_code,
    product_name = excluded.product_name, product_name_search = excluded.product_name_search,
    currency_code = excluded.currency_code, availability_label = excluded.availability_label,
    stock_status_label = excluded.stock_status_label, latest_price = excluded.latest_price,
    previous_price = excluded.previous_price, first_price = excluded.first_price,
    list_price_with_vat = excluded.list_price_with_vat, source_url = excluded.source_url,
    latest_scraped_at = excluded.latest_scraped_at, hero_image_url = excluded.hero_image_url,
    gallery_image_urls = excluded.gallery_image_urls, short_description = excluded.short_description,
    supplementary_parameters = excluded.supplementary_parameters, metadata = excluded.metadata,
    category_tags = excluded.category_tags, genre_tags = excluded.genre_tags,
    game_type_tags = excluded.game_type_tags, mechanic_tags = excluded.mechanic_tags,
    availability_status = excluded.availability_status, is_available = excluded.is_available,
    is_preorder = excluded.is_preorder, min_age = excluded.min_age,
    min_players = excluded.min_players, max_players = excluded.max_players,
    min_playtime_minutes = excluded.min_playtime_minutes,
    max_playtime_minutes = excluded.max_playtime_minutes, ean_codes = excluded.ean_codes,
    manufacturer = excluded.manufacturer, boardgamegeek_rating = excluded.boardgamegeek_rating,
    price_movement = excluded.price_movement, price_points = excluded.price_points,
    updated_at = now();
  get diagnostics v_upserted_seller_rows = row_count;

  delete from public.catalog_slug_seller_state existing
  where existing.product_name_normalized in (
    select product_name_normalized from tmp_changed_slugs
  )
    and not exists (
      select 1
      from tmp_seller_state_delta delta
      where delta.product_name_normalized = existing.product_name_normalized
        and delta.seller = existing.seller
    );
  get diagnostics v_deleted_seller_rows = row_count;

  delete from public.catalog_slug_seller_state existing
  where existing.product_name_normalized in (
    select source_slug.product_name_normalized
    from tmp_changed_source_slugs source_slug
    left join tmp_changed_slugs canonical_slug
      using (product_name_normalized)
    where canonical_slug.product_name_normalized is null
  );
  get diagnostics v_deleted_stale_seller_rows = row_count;

  create temp table tmp_slug_state_delta on commit drop as
  with ranked as (
    select
      css.*,
      row_number() over (
        partition by css.product_name_normalized
        order by public.seller_priority(css.seller), css.latest_scraped_at desc
      ) as seller_rank
    from public.catalog_slug_seller_state css
    join tmp_changed_slugs c using (product_name_normalized)
  ),
  primary_seller as (select * from ranked where seller_rank = 1),
  merged as (
    select
      css.product_name_normalized,
      coalesce(array_agg(distinct category_tag order by category_tag)
        filter (where category_tag is not null), '{}'::text[]) as category_tags,
      coalesce(array_agg(distinct genre_tag order by genre_tag)
        filter (where genre_tag is not null), '{}'::text[]) as genre_tags,
      coalesce(array_agg(distinct game_type_tag order by game_type_tag)
        filter (where game_type_tag is not null), '{}'::text[]) as game_type_tags,
      coalesce(array_agg(distinct mechanic_tag order by mechanic_tag)
        filter (where mechanic_tag is not null), '{}'::text[]) as mechanic_tags,
      coalesce(array_agg(distinct ean_code order by ean_code)
        filter (where ean_code is not null), '{}'::text[]) as ean_codes,
      bool_or(css.is_available) as is_available,
      bool_or(css.is_preorder) as is_preorder,
      min(css.min_age) as min_age,
      min(css.min_players) as min_players,
      max(css.max_players) as max_players,
      min(css.min_playtime_minutes) as min_playtime_minutes,
      max(css.max_playtime_minutes) as max_playtime_minutes
    from public.catalog_slug_seller_state css
    join tmp_changed_slugs c using (product_name_normalized)
    left join lateral unnest(css.category_tags) category_tag on true
    left join lateral unnest(css.genre_tags) genre_tag on true
    left join lateral unnest(css.game_type_tags) game_type_tag on true
    left join lateral unnest(css.mechanic_tags) mechanic_tag on true
    left join lateral unnest(css.ean_codes) ean_code on true
    group by css.product_name_normalized
  ),
  search_terms as (
    select
      product_name_normalized,
      unaccent(lower(string_agg(distinct term, ' '))) as product_name_search
    from (
      select css.product_name_normalized, css.product_name as term
      from public.catalog_slug_seller_state css
      join tmp_changed_slugs using (product_name_normalized)
      union all
      select css.product_name_normalized, css.product_code as term
      from public.catalog_slug_seller_state css
      join tmp_changed_slugs using (product_name_normalized)
      union all
      select alias.canonical_product_id, alias.product_name_normalized as term
      from public.canonical_product_aliases alias
      join tmp_changed_slugs changed
        on changed.product_name_normalized = alias.canonical_product_id
      union all
      select alias.canonical_product_id, alias.product_code as term
      from public.canonical_product_aliases alias
      join tmp_changed_slugs changed
        on changed.product_name_normalized = alias.canonical_product_id
    ) terms
    where term is not null and trim(term) <> ''
    group by product_name_normalized
  )
  select
    p.product_name_normalized, p.seller as primary_seller, p.product_code, p.product_name,
    coalesce(st.product_name_search, p.product_name_search) as product_name_search,
    p.currency_code, p.availability_label, p.stock_status_label,
    p.latest_price, p.previous_price, p.first_price, p.list_price_with_vat, p.source_url,
    p.latest_scraped_at, p.hero_image_url, p.gallery_image_urls, p.short_description,
    p.supplementary_parameters, p.metadata, m.category_tags, coalesce(m.is_available, false) as is_available,
    coalesce(m.is_preorder, false) as is_preorder,
    null::jsonb as price_points, m.genre_tags, m.game_type_tags,
    m.mechanic_tags,
    case when m.is_available then 'available' when m.is_preorder then 'preorder'
      else p.availability_status end as availability_status,
    m.min_age, m.min_players, m.max_players, m.min_playtime_minutes,
    m.max_playtime_minutes, m.ean_codes, p.manufacturer, p.boardgamegeek_rating,
    p.price_movement
  from primary_seller p
  left join merged m using (product_name_normalized)
  left join search_terms st using (product_name_normalized);

  insert into public.catalog_slug_state (
    product_name_normalized, primary_seller, product_code, product_name, product_name_search,
    currency_code, availability_label, stock_status_label, latest_price, previous_price,
    first_price, list_price_with_vat, source_url, latest_scraped_at, hero_image_url,
    gallery_image_urls, short_description, supplementary_parameters, metadata, category_tags,
    is_available, is_preorder, price_points, genre_tags, game_type_tags, mechanic_tags,
    availability_status, min_age, min_players, max_players, min_playtime_minutes,
    max_playtime_minutes, ean_codes, manufacturer, boardgamegeek_rating, price_movement
  )
  select * from tmp_slug_state_delta
  on conflict (product_name_normalized) do update set
    primary_seller = excluded.primary_seller, product_code = excluded.product_code,
    product_name = excluded.product_name, product_name_search = excluded.product_name_search,
    currency_code = excluded.currency_code, availability_label = excluded.availability_label,
    stock_status_label = excluded.stock_status_label, latest_price = excluded.latest_price,
    previous_price = excluded.previous_price, first_price = excluded.first_price,
    list_price_with_vat = excluded.list_price_with_vat, source_url = excluded.source_url,
    latest_scraped_at = excluded.latest_scraped_at, hero_image_url = excluded.hero_image_url,
    gallery_image_urls = excluded.gallery_image_urls, short_description = excluded.short_description,
    supplementary_parameters = excluded.supplementary_parameters, metadata = excluded.metadata,
    category_tags = excluded.category_tags, is_available = excluded.is_available,
    is_preorder = excluded.is_preorder, price_points = excluded.price_points,
    genre_tags = excluded.genre_tags, game_type_tags = excluded.game_type_tags,
    mechanic_tags = excluded.mechanic_tags, availability_status = excluded.availability_status,
    min_age = excluded.min_age, min_players = excluded.min_players,
    max_players = excluded.max_players, min_playtime_minutes = excluded.min_playtime_minutes,
    max_playtime_minutes = excluded.max_playtime_minutes, ean_codes = excluded.ean_codes,
    manufacturer = excluded.manufacturer, boardgamegeek_rating = excluded.boardgamegeek_rating,
    price_movement = excluded.price_movement, updated_at = now();
  get diagnostics v_upserted_slug_rows = row_count;

  delete from public.catalog_slug_state existing
  where existing.product_name_normalized in (
    select product_name_normalized from tmp_changed_slugs
  )
    and not exists (
      select 1
      from public.catalog_slug_seller_state css
      where css.product_name_normalized = existing.product_name_normalized
    );
  get diagnostics v_deleted_slug_rows = row_count;

  delete from public.catalog_slug_state existing
  where existing.product_name_normalized in (
    select source_slug.product_name_normalized
    from tmp_changed_source_slugs source_slug
    left join tmp_changed_slugs canonical_slug
      using (product_name_normalized)
    where canonical_slug.product_name_normalized is null
  );
  get diagnostics v_deleted_stale_slug_rows = row_count;

  return jsonb_build_object(
    'changed_slugs', v_changed_slug_count,
    'upserted_seller_rows', v_upserted_seller_rows,
    'deleted_seller_rows', v_deleted_seller_rows,
    'upserted_slug_rows', v_upserted_slug_rows,
    'deleted_slug_rows', v_deleted_slug_rows,
    'deleted_stale_seller_rows', v_deleted_stale_seller_rows,
    'deleted_stale_slug_rows', v_deleted_stale_slug_rows
  );
end;
$$;
