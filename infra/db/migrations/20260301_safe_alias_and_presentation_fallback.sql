create or replace function public.canonical_product_slug(
  p_seller text,
  p_product_code text,
  p_current_slug text
) returns text
language plpgsql
stable
as $$
declare
  v_slug text := lower(trim(coalesce(p_current_slug, '')));
  v_canonical_product_id text;
begin
  if nullif(trim(coalesce(p_seller, '')), '') is not null
    and nullif(trim(coalesce(p_product_code, '')), '') is not null then
    select alias.canonical_product_id
    into v_canonical_product_id
    from public.canonical_product_aliases alias
    where lower(alias.seller) = lower(trim(p_seller))
      and lower(alias.product_code) = lower(trim(p_product_code))
    order by alias.confidence desc, alias.updated_at desc
    limit 1;

    if v_canonical_product_id is not null then
      return v_canonical_product_id;
    end if;
  end if;

  select alias.canonical_product_id
  into v_canonical_product_id
  from public.canonical_product_aliases alias
  where lower(trim(alias.product_name_normalized)) = v_slug
  order by alias.confidence desc, alias.updated_at desc
  limit 1;

  return coalesce(v_canonical_product_id, v_slug);
end;
$$;

create or replace function public.catalog_preferred_product_name(p_slug text)
returns text language sql stable as $$
  select nullif(trim(product_name), '')
  from public.catalog_slug_seller_state
  where product_name_normalized = p_slug
    and nullif(trim(product_name), '') is not null
  order by public.seller_priority(seller), latest_scraped_at desc
  limit 1;
$$;

create or replace function public.catalog_preferred_hero_image(p_slug text)
returns text language sql stable as $$
  select nullif(trim(hero_image_url), '')
  from public.catalog_slug_seller_state
  where product_name_normalized = p_slug
    and nullif(trim(hero_image_url), '') is not null
  order by public.seller_priority(seller), latest_scraped_at desc
  limit 1;
$$;

create or replace function public.catalog_preferred_gallery(p_slug text)
returns text[] language sql stable as $$
  select gallery_image_urls
  from public.catalog_slug_seller_state
  where product_name_normalized = p_slug
    and cardinality(gallery_image_urls) > 0
  order by public.seller_priority(seller), latest_scraped_at desc
  limit 1;
$$;

create or replace function public.catalog_preferred_description(p_slug text)
returns text language sql stable as $$
  select nullif(trim(short_description), '')
  from public.catalog_slug_seller_state
  where product_name_normalized = p_slug
    and nullif(trim(short_description), '') is not null
  order by public.seller_priority(seller), latest_scraped_at desc
  limit 1;
$$;

create or replace function public.catalog_preferred_parameters(p_slug text)
returns jsonb language sql stable as $$
  select supplementary_parameters
  from public.catalog_slug_seller_state
  where product_name_normalized = p_slug
    and supplementary_parameters not in ('[]'::jsonb, '{}'::jsonb, 'null'::jsonb)
  order by public.seller_priority(seller), latest_scraped_at desc
  limit 1;
$$;

create or replace function public.apply_catalog_presentation_fallback()
returns trigger language plpgsql as $$
begin
  new.product_name := coalesce(
    nullif(trim(new.product_name), ''),
    public.catalog_preferred_product_name(new.product_name_normalized)
  );
  new.hero_image_url := coalesce(
    nullif(trim(new.hero_image_url), ''),
    public.catalog_preferred_hero_image(new.product_name_normalized)
  );
  if coalesce(cardinality(new.gallery_image_urls), 0) = 0 then
    new.gallery_image_urls := coalesce(
      public.catalog_preferred_gallery(new.product_name_normalized),
      '{}'::text[]
    );
  end if;
  new.short_description := coalesce(
    nullif(trim(new.short_description), ''),
    public.catalog_preferred_description(new.product_name_normalized)
  );
  if coalesce(new.supplementary_parameters, '[]'::jsonb)
    in ('[]'::jsonb, '{}'::jsonb, 'null'::jsonb) then
    new.supplementary_parameters := coalesce(
      public.catalog_preferred_parameters(new.product_name_normalized),
      '[]'::jsonb
    );
  end if;
  return new;
end;
$$;

drop trigger if exists catalog_presentation_fallback on public.catalog_slug_state;
create trigger catalog_presentation_fallback
before insert or update on public.catalog_slug_state
for each row execute function public.apply_catalog_presentation_fallback();

update public.catalog_slug_state
set updated_at = updated_at
where product_name is null
  or trim(product_name) = ''
  or hero_image_url is null
  or trim(hero_image_url) = ''
  or coalesce(cardinality(gallery_image_urls), 0) = 0
  or short_description is null
  or trim(short_description) = ''
  or coalesce(supplementary_parameters, '[]'::jsonb)
    in ('[]'::jsonb, '{}'::jsonb, 'null'::jsonb);


