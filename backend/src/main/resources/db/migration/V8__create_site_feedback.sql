create table site_feedback (
    id uuid primary key,
    app_user_id bigint not null unique references app_users(id) on delete cascade,
    display_name varchar(120) not null,
    rating smallint not null check (rating between 1 and 5),
    message varchar(500) not null,
    publication_status varchar(16) not null default 'PUBLISHED'
        check (publication_status in ('PUBLISHED', 'HIDDEN')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index ix_site_feedback_public_updated
    on site_feedback (publication_status, updated_at desc);

alter table site_feedback enable row level security;
