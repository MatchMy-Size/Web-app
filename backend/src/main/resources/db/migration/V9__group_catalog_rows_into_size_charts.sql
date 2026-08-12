alter table brand_size_measurements
    add column size_chart_id uuid;

with chart_keys as (
    select catalog_id,
           md5(concat_ws(
               '|',
               seller_app_user_id::text,
               lower(coalesce(nullif(trim(gender), ''), nullif(trim(raw_data ->> 'gender'), ''), nullif(trim(category), ''), 'unknown')),
               lower(coalesce(nullif(trim(clothing_type), ''), nullif(trim(raw_data ->> 'clothingType'), ''), nullif(trim(subcategory), ''), 'general')),
               lower(coalesce(nullif(trim(subcategory), ''), nullif(trim(raw_data ->> 'subCategory'), ''), '' )),
               lower(coalesce(nullif(trim(business_name), ''), nullif(trim(brand_name), ''), nullif(trim(raw_data ->> 'brandName'), ''), 'brand'))
           )) as chart_hash
      from brand_size_measurements
)
update brand_size_measurements catalog
   set size_chart_id = (
       substr(keys.chart_hash, 1, 8) || '-' ||
       substr(keys.chart_hash, 9, 4) || '-' ||
       substr(keys.chart_hash, 13, 4) || '-' ||
       substr(keys.chart_hash, 17, 4) || '-' ||
       substr(keys.chart_hash, 21, 12)
   )::uuid
  from chart_keys keys
 where catalog.catalog_id = keys.catalog_id;

alter table brand_size_measurements
    alter column size_chart_id set not null;

create index ix_brand_size_measurements_seller_chart
    on brand_size_measurements (seller_app_user_id, size_chart_id, active);
