-- Clerk Core v2 nests org claims under `o` (o.id, o.rol, o.slg).
-- Our previous policies read auth.jwt()->>'org_id' which is NULL in v2 tokens,
-- causing trips INSERT to fail RLS even with an active org. COALESCE supports
-- both the v2 nested path and the v1 flat path so the policies survive future
-- SDK transitions.
--
-- trips_update_editor is also tightened: previously it was (org_match OR role),
-- which let any org member update any trip regardless of role. The corrected
-- semantic is (org_match AND role) so writes require both.
-- trips_delete_owner is left as-is (no org_id reference).

drop policy if exists trips_insert_creator on public.trips;
drop policy if exists trips_select_member on public.trips;
drop policy if exists trips_update_editor on public.trips;

create policy trips_insert_creator on public.trips
  for insert to authenticated
  with check (
    created_by = (auth.jwt() ->> 'sub')
    and org_id = coalesce(auth.jwt() -> 'o' ->> 'id', auth.jwt() ->> 'org_id')
  );

create policy trips_select_member on public.trips
  for select to authenticated
  using (
    org_id = coalesce(auth.jwt() -> 'o' ->> 'id', auth.jwt() ->> 'org_id')
    or exists (
      select 1 from public.trip_members tm
      where tm.trip_id = trips.id
        and tm.profile_id = (auth.jwt() ->> 'sub')
    )
  );

create policy trips_update_editor on public.trips
  for update to authenticated
  using (
    org_id = coalesce(auth.jwt() -> 'o' ->> 'id', auth.jwt() ->> 'org_id')
    and exists (
      select 1 from public.trip_members tm
      where tm.trip_id = trips.id
        and tm.profile_id = (auth.jwt() ->> 'sub')
        and tm.role = any (array['editor','owner']::trip_role[])
    )
  )
  with check (
    org_id = coalesce(auth.jwt() -> 'o' ->> 'id', auth.jwt() ->> 'org_id')
    and exists (
      select 1 from public.trip_members tm
      where tm.trip_id = trips.id
        and tm.profile_id = (auth.jwt() ->> 'sub')
        and tm.role = any (array['editor','owner']::trip_role[])
    )
  );
