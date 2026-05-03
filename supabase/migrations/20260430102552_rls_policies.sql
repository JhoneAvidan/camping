-- Helpers (SECURITY DEFINER to break recursion on trip_members)
create or replace function public.is_platform_admin(uid uuid)
returns boolean
language sql stable security definer set search_path = public, auth as $$
  select exists (
    select 1 from public.profiles
    where id = uid and platform_role = 'super_admin'
  );
$$;

create or replace function public.is_trip_member(t_id uuid, uid uuid)
returns boolean
language sql stable security definer set search_path = public, auth as $$
  select exists (
    select 1 from public.trip_members
    where trip_id = t_id and profile_id = uid
  );
$$;

create or replace function public.has_trip_role(t_id uuid, uid uuid, required public.trip_role)
returns boolean
language sql stable security definer set search_path = public, auth as $$
  select exists (
    select 1 from public.trip_members
    where trip_id = t_id
      and profile_id = uid
      and case required
        when 'viewer' then role in ('viewer', 'editor', 'owner')
        when 'editor' then role in ('editor', 'owner')
        when 'owner'  then role = 'owner'
      end
  );
$$;

revoke all on function public.is_platform_admin(uuid)         from public;
revoke all on function public.is_trip_member(uuid, uuid)      from public;
revoke all on function public.has_trip_role(uuid, uuid, public.trip_role) from public;
grant execute on function public.is_platform_admin(uuid)         to authenticated;
grant execute on function public.is_trip_member(uuid, uuid)      to authenticated;
grant execute on function public.has_trip_role(uuid, uuid, public.trip_role) to authenticated;

-- Enable RLS
alter table public.profiles         enable row level security;
alter table public.destinations     enable row level security;
alter table public.categories       enable row level security;
alter table public.trips            enable row level security;
alter table public.trip_members     enable row level security;
alter table public.items            enable row level security;
alter table public.item_claims      enable row level security;
alter table public.trip_invitations enable row level security;
alter table public.audit_events     enable row level security;

-- profiles
create policy profiles_select_public on public.profiles
  for select to authenticated using (true);

create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and platform_role = (select platform_role from public.profiles where id = auth.uid()));

create policy profiles_admin_all on public.profiles
  for all to authenticated
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

-- destinations
create policy destinations_select_all on public.destinations
  for select to authenticated using (is_active or public.is_platform_admin(auth.uid()));

create policy destinations_admin_write on public.destinations
  for all to authenticated
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

-- categories
create policy categories_select on public.categories
  for select to authenticated
  using (
    trip_id is null
    or public.is_trip_member(trip_id, auth.uid())
    or public.is_platform_admin(auth.uid())
  );

create policy categories_write_editor on public.categories
  for all to authenticated
  using (
    trip_id is not null
    and public.has_trip_role(trip_id, auth.uid(), 'editor')
  )
  with check (
    trip_id is not null
    and public.has_trip_role(trip_id, auth.uid(), 'editor')
  );

create policy categories_admin_global on public.categories
  for all to authenticated
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

-- trips
create policy trips_select_member on public.trips
  for select to authenticated
  using (public.is_trip_member(id, auth.uid()) or public.is_platform_admin(auth.uid()));

create policy trips_insert_creator on public.trips
  for insert to authenticated
  with check (created_by = auth.uid());

create policy trips_update_editor on public.trips
  for update to authenticated
  using (public.has_trip_role(id, auth.uid(), 'editor'))
  with check (public.has_trip_role(id, auth.uid(), 'editor'));

create policy trips_delete_owner on public.trips
  for delete to authenticated
  using (public.has_trip_role(id, auth.uid(), 'owner') or public.is_platform_admin(auth.uid()));

-- trip_members
create policy trip_members_select on public.trip_members
  for select to authenticated
  using (public.is_trip_member(trip_id, auth.uid()) or public.is_platform_admin(auth.uid()));

create policy trip_members_owner_write on public.trip_members
  for all to authenticated
  using (public.has_trip_role(trip_id, auth.uid(), 'owner') or public.is_platform_admin(auth.uid()))
  with check (public.has_trip_role(trip_id, auth.uid(), 'owner') or public.is_platform_admin(auth.uid()));

-- items
create policy items_select on public.items
  for select to authenticated
  using (public.is_trip_member(trip_id, auth.uid()) or public.is_platform_admin(auth.uid()));

create policy items_write_editor on public.items
  for all to authenticated
  using (public.has_trip_role(trip_id, auth.uid(), 'editor'))
  with check (
    public.has_trip_role(trip_id, auth.uid(), 'editor')
    and created_by = auth.uid()
  );

-- item_claims
create policy item_claims_select on public.item_claims
  for select to authenticated
  using (
    exists (
      select 1 from public.items i
      where i.id = item_claims.item_id
        and (public.is_trip_member(i.trip_id, auth.uid()) or public.is_platform_admin(auth.uid()))
    )
  );

create policy item_claims_self_write on public.item_claims
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy item_claims_editor_override on public.item_claims
  for all to authenticated
  using (
    exists (
      select 1 from public.items i
      where i.id = item_claims.item_id
        and public.has_trip_role(i.trip_id, auth.uid(), 'editor')
    )
  )
  with check (
    exists (
      select 1 from public.items i
      where i.id = item_claims.item_id
        and public.has_trip_role(i.trip_id, auth.uid(), 'editor')
    )
  );

-- trip_invitations
create policy invitations_owner on public.trip_invitations
  for all to authenticated
  using (public.has_trip_role(trip_id, auth.uid(), 'owner') or public.is_platform_admin(auth.uid()))
  with check (public.has_trip_role(trip_id, auth.uid(), 'owner'));

-- audit_events: SELECT only (writes via trusted RPCs)
create policy audit_events_select_member on public.audit_events
  for select to authenticated
  using (
    (trip_id is not null and public.is_trip_member(trip_id, auth.uid()))
    or public.is_platform_admin(auth.uid())
  );
