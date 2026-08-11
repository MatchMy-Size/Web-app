create table fit_feedback (
    id uuid primary key,
    app_user_id bigint not null references app_users(id) on delete cascade,
    catalog_id varchar(256) not null references brand_size_measurements(catalog_id) on delete restrict,
    measurement_profile_key varchar(128) not null,
    experience varchar(16) not null check (experience in ('TRIED', 'BOUGHT')),
    outcome varchar(24) not null check (outcome in ('TOO_SMALL', 'PERFECT', 'TOO_LARGE')),
    recommended_size varchar(80) not null,
    recommendation_score numeric(5, 2) not null check (
        recommendation_score >= 0 and recommendation_score <= 100
    ),
    confidence varchar(16) not null check (confidence in ('HIGH', 'LIMITED')),
    algorithm_version varchar(32) not null,
    brand_name text not null,
    product_title text not null,
    category text not null,
    note varchar(1000),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (app_user_id, catalog_id, measurement_profile_key)
);

create index ix_fit_feedback_user_created
    on fit_feedback (app_user_id, created_at desc);

create index ix_fit_feedback_catalog_outcome
    on fit_feedback (catalog_id, outcome);

alter table fit_feedback enable row level security;
