create table app_users (
    id bigserial primary key,
    auth_user_id uuid not null unique,
    auth_email text,
    phone_number varchar(32),
    email text,
    role varchar(40) not null default 'customer',
    status varchar(40) not null default 'active',
    profile_data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index ux_app_users_auth_email_lower
    on app_users (lower(auth_email))
    where auth_email is not null;
create index ix_app_users_role on app_users (role);

create table customer_measurements (
    app_user_id bigint primary key references app_users(id) on delete cascade,
    measurement_data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table family_members (
    id bigserial primary key,
    app_user_id bigint not null references app_users(id) on delete cascade,
    member_key varchar(128) not null,
    member_data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (app_user_id, member_key)
);

create table brand_size_measurements (
    catalog_id varchar(256) primary key,
    brand_name text,
    business_name text,
    clothing_type text,
    gender text,
    category text,
    subcategory text,
    size_label text,
    size_key numeric,
    unit varchar(16),
    average_point numeric,
    active boolean not null default true,
    raw_data jsonb not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index ix_brand_size_measurements_lookup
    on brand_size_measurements (active, gender, clothing_type, brand_name);

create table otp_sessions (
    id uuid primary key,
    purpose varchar(40) not null,
    phone_number varchar(32) not null,
    code_hash varchar(128) not null,
    status varchar(32) not null default 'pending',
    attempt_count integer not null default 0,
    message_uid text,
    expires_at timestamptz not null,
    verified_at timestamptz,
    consumed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index ix_otp_sessions_phone_created on otp_sessions (phone_number, created_at desc);
