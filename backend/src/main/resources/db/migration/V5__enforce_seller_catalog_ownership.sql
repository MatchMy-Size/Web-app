alter table brand_size_measurements
    add column seller_app_user_id bigint;

update brand_size_measurements catalog
   set seller_app_user_id = seller.id
  from app_users seller
 where seller.role = 'seller'
   and seller.source_account_id = regexp_replace(
       coalesce(
           catalog.raw_data->>'sellerUid',
           catalog.raw_data->>'sellerId',
           catalog.raw_data->>'sellerRef'
       ),
       '^.*/',
       ''
   );

do $$
begin
    if exists (
        select 1
          from brand_size_measurements
         where seller_app_user_id is null
    ) then
        raise exception 'Every catalog record must reference a restored seller account';
    end if;
end $$;

alter table brand_size_measurements
    alter column seller_app_user_id set not null,
    add constraint fk_brand_size_measurements_seller
        foreign key (seller_app_user_id)
        references app_users (id)
        on delete restrict;

create index ix_brand_size_measurements_seller
    on brand_size_measurements (seller_app_user_id);
