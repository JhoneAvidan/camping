-- Phase 3 prereq: the trips RLS hotfix in 20260503205046 patched the trips
-- policies to read Clerk Core v2's nested org claim (auth.jwt()->'o'->>'id'),
-- but the SECURITY DEFINER helpers `is_trip_member` and `has_trip_role` were
-- left on the v1 flat path (auth.jwt()->>'org_id'). On v2 tokens that path is
-- NULL, so the org branch in those helpers always fails. Today this is masked
-- because handle_new_trip writes a trip_members row for the trip creator —
-- but the moment a second org member tries to read a teammate's trip, its
-- categories, items, or claims, RLS silently denies them.
--
-- Phase 3 introduces categories/items/claims UI for multiple org members, so
-- the bug must be fixed before that UI ships. This migration uses
-- CREATE OR REPLACE so the policies that depend on these helpers are kept
-- intact.

create or replace function public.is_trip_member(t_id uuid, uid text)
  returns boolean
  language sql
  stable security definer
  set search_path = public, auth
as $func$
  select exists (
    select 1 from public.trips t
    where t.id = t_id
      and (
        t.org_id = coalesce(auth.jwt() -> 'o' ->> 'id', auth.jwt() ->> 'org_id')
        or exists (
          select 1 from public.trip_members tm
          where tm.trip_id = t_id and tm.profile_id = uid
        )
      )
  );
$func$;

create or replace function public.has_trip_role(t_id uuid, uid text, required trip_role)
  returns boolean
  language sql
  stable security definer
  set search_path = public, auth
as $func$
  select case required
    when 'viewer' then public.is_trip_member(t_id, uid)
    when 'editor' then exists (
      select 1 from public.trips t
      where t.id = t_id
        and (
          t.org_id = coalesce(auth.jwt() -> 'o' ->> 'id', auth.jwt() ->> 'org_id')
          or exists (
            select 1 from public.trip_members tm
            where tm.trip_id = t_id and tm.profile_id = uid
              and tm.role in ('editor','owner')
          )
        )
    )
    when 'owner' then exists (
      select 1 from public.trip_members tm
      where tm.trip_id = t_id and tm.profile_id = uid and tm.role = 'owner'
    )
    else false
  end;
$func$;
