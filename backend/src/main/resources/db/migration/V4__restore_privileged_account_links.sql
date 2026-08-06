alter table app_users
    add column if not exists source_account_id varchar(128);

create unique index if not exists ux_app_users_source_account_id
    on app_users (source_account_id)
    where source_account_id is not null;
