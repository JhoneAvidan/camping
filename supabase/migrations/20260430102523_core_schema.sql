-- profiles
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  display_name    text not null check (length(display_name) between 1 and 80),
  avatar_url      text,
  platform_role   public.platform_role not null default 'user',
  locale          text not null default 'he',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index profiles_platform_role_idx on public.profiles (platform_role)
  where platform_role <> 'user';

-- destinations
create table public.destinations (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  region          text,
  description     text,
  location        extensions.geography(Point, 4326),
  external_ref    text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index destinations_location_gix on public.destinations
  using gist (location);
create index destinations_active_idx on public.destinations (is_active)
  where is_active;

-- categories
create table public.categories (
  id              uuid primary key default gen_random_uuid(),
  trip_id         uuid,
  kind            public.item_kind not null,
  name            text not null check (length(name) between 1 and 60),
  sort_order      smallint not null default 0,
  is_archived     boolean not null default false,
  created_at      timestamptz not null default now()
);

create unique index categories_global_unique
  on public.categories (kind, name)
  where trip_id is null;

-- trips
create table public.trips (
  id              uuid primary key default gen_random_uuid(),
  name            text not null check (length(name) between 1 and 120),
  destination_id  uuid references public.destinations(id) on delete set null,
  starts_on       date,
  ends_on         date,
  notes           text,
  created_by      uuid not null references public.profiles(id) on delete restrict,
  archived_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint trips_dates_chk check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

create index trips_created_by_idx on public.trips (created_by);
create index trips_active_idx on public.trips (archived_at) where archived_at is null;

alter table public.categories
  add constraint categories_trip_fk
  foreign key (trip_id) references public.trips(id) on delete cascade;

-- trip_members
create table public.trip_members (
  trip_id         uuid not null references public.trips(id) on delete cascade,
  profile_id      uuid not null references public.profiles(id) on delete cascade,
  role            public.trip_role not null default 'viewer',
  joined_at       timestamptz not null default now(),
  primary key (trip_id, profile_id)
);

create index trip_members_profile_idx on public.trip_members (profile_id);

-- items
create table public.items (
  id              uuid primary key default gen_random_uuid(),
  trip_id         uuid not null references public.trips(id) on delete cascade,
  category_id     uuid references public.categories(id) on delete set null,
  kind            public.item_kind not null,
  name            text not null check (length(name) between 1 and 200),
  quantity        smallint not null default 1 check (quantity > 0),
  unit            text,
  notes           text,
  sort_order      integer not null default 0,
  created_by      uuid not null references public.profiles(id) on delete restrict,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index items_trip_idx on public.items (trip_id, sort_order);
create index items_category_idx on public.items (category_id);

-- item_claims
create table public.item_claims (
  item_id         uuid not null references public.items(id) on delete cascade,
  profile_id      uuid not null references public.profiles(id) on delete cascade,
  state           public.claim_state not null default 'claimed',
  claimed_at      timestamptz not null default now(),
  packed_at       timestamptz,
  primary key (item_id, profile_id),
  constraint item_claims_packed_chk check (
    (state = 'claimed' and packed_at is null) or
    (state = 'packed'  and packed_at is not null)
  )
);

create index item_claims_profile_idx on public.item_claims (profile_id);

-- trip_invitations
create table public.trip_invitations (
  id              uuid primary key default gen_random_uuid(),
  trip_id         uuid not null references public.trips(id) on delete cascade,
  email           extensions.citext not null,
  role            public.trip_role not null default 'viewer',
  token           text not null unique,
  status          public.invitation_status not null default 'pending',
  invited_by      uuid not null references public.profiles(id) on delete restrict,
  expires_at      timestamptz not null default (now() + interval '14 days'),
  accepted_by     uuid references public.profiles(id) on delete set null,
  accepted_at     timestamptz,
  created_at      timestamptz not null default now()
);

create unique index trip_invitations_pending_unique
  on public.trip_invitations (trip_id, email)
  where status = 'pending';

-- audit_events (no cascading FKs)
create table public.audit_events (
  id              bigint generated always as identity primary key,
  trip_id         uuid,
  actor_id        uuid,
  action          text not null,
  target_kind     text,
  target_id       uuid,
  payload         jsonb,
  created_at      timestamptz not null default now()
);

create index audit_events_trip_idx on public.audit_events (trip_id, created_at desc);
create index audit_events_actor_idx on public.audit_events (actor_id, created_at desc);

-- updated_at trigger
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at      before update on public.profiles
  for each row execute function public.tg_set_updated_at();
create trigger destinations_set_updated_at  before update on public.destinations
  for each row execute function public.tg_set_updated_at();
create trigger trips_set_updated_at         before update on public.trips
  for each row execute function public.tg_set_updated_at();
create trigger items_set_updated_at         before update on public.items
  for each row execute function public.tg_set_updated_at();
