-- MatchMySize stores all measurement values in centimetres. The legacy Firestore import
-- contains both centimetre and inch-based seller charts, so normalize the inch rows once.
with normalized_rows as (
    select
        catalog.catalog_id,
        jsonb_object_agg(
            measurement.key,
            to_jsonb(round((measurement.value #>> '{}')::numeric * 2.54, 2))
        ) as measurements,
        round(avg((measurement.value #>> '{}')::numeric * 2.54), 2) as average_point
      from brand_size_measurements catalog
      cross join lateral jsonb_each(coalesce(catalog.raw_data -> 'measurements', '{}'::jsonb)) measurement
     where lower(coalesce(catalog.raw_data ->> 'unit', catalog.unit, '')) in ('in', 'inch', 'inches', 'imperial')
     group by catalog.catalog_id
)
update brand_size_measurements catalog
   set raw_data = jsonb_set(
           jsonb_set(
               jsonb_set(catalog.raw_data, '{measurements}', normalized.measurements, true),
               '{averagePoint}', to_jsonb(normalized.average_point), true
           ),
           '{unit}', to_jsonb('cm'::text), true
       ),
       unit = 'cm',
       average_point = normalized.average_point,
       updated_at = now()
  from normalized_rows normalized
 where catalog.catalog_id = normalized.catalog_id;
