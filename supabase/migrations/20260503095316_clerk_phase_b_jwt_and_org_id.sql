-- Phase B: Convert UUID user references to TEXT for Clerk; add org_id; rewrite RLS

-- 1. Drop all RLS policies (30 total)
DROP POLICY IF EXISTS audit_events_select_member ON public.audit_events;
DROP POLICY IF EXISTS categories_delete ON public.categories;
DROP POLICY IF EXISTS categories_insert ON public.categories;
DROP POLICY IF EXISTS categories_select ON public.categories;
DROP POLICY IF EXISTS categories_update ON public.categories;
DROP POLICY IF EXISTS destinations_admin_delete ON public.destinations;
DROP POLICY IF EXISTS destinations_admin_insert ON public.destinations;
DROP POLICY IF EXISTS destinations_admin_update ON public.destinations;
DROP POLICY IF EXISTS destinations_select_all ON public.destinations;
DROP POLICY IF EXISTS item_claims_delete ON public.item_claims;
DROP POLICY IF EXISTS item_claims_insert ON public.item_claims;
DROP POLICY IF EXISTS item_claims_select ON public.item_claims;
DROP POLICY IF EXISTS item_claims_update ON public.item_claims;
DROP POLICY IF EXISTS items_delete ON public.items;
DROP POLICY IF EXISTS items_insert ON public.items;
DROP POLICY IF EXISTS items_select ON public.items;
DROP POLICY IF EXISTS items_update ON public.items;
DROP POLICY IF EXISTS profiles_admin_delete ON public.profiles;
DROP POLICY IF EXISTS profiles_admin_insert ON public.profiles;
DROP POLICY IF EXISTS profiles_select_public ON public.profiles;
DROP POLICY IF EXISTS profiles_update_self ON public.profiles;
DROP POLICY IF EXISTS invitations_owner ON public.trip_invitations;
DROP POLICY IF EXISTS trip_members_owner_delete ON public.trip_members;
DROP POLICY IF EXISTS trip_members_owner_insert ON public.trip_members;
DROP POLICY IF EXISTS trip_members_owner_update ON public.trip_members;
DROP POLICY IF EXISTS trip_members_select ON public.trip_members;
DROP POLICY IF EXISTS trips_delete_owner ON public.trips;
DROP POLICY IF EXISTS trips_insert_creator ON public.trips;
DROP POLICY IF EXISTS trips_select_member ON public.trips;
DROP POLICY IF EXISTS trips_update_editor ON public.trips;

-- 2. Drop auth.users trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_auth_user();

-- 3. Drop helper functions
DROP FUNCTION IF EXISTS public.has_trip_role(uuid, uuid, trip_role);
DROP FUNCTION IF EXISTS public.is_trip_member(uuid, uuid);
DROP FUNCTION IF EXISTS public.is_platform_admin(uuid);

-- 4. Drop FKs that reference profiles.id or auth.users
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.trips DROP CONSTRAINT IF EXISTS trips_created_by_fkey;
ALTER TABLE public.trip_members DROP CONSTRAINT IF EXISTS trip_members_profile_id_fkey;
ALTER TABLE public.item_claims DROP CONSTRAINT IF EXISTS item_claims_profile_id_fkey;
ALTER TABLE public.items DROP CONSTRAINT IF EXISTS items_created_by_fkey;
ALTER TABLE public.trip_invitations DROP CONSTRAINT IF EXISTS trip_invitations_invited_by_fkey;
ALTER TABLE public.trip_invitations DROP CONSTRAINT IF EXISTS trip_invitations_accepted_by_fkey;

-- 5. Truncate user-bound tables (POC data only; preserve destinations)
TRUNCATE TABLE
  public.audit_events,
  public.item_claims,
  public.items,
  public.categories,
  public.trip_invitations,
  public.trip_members,
  public.trips,
  public.profiles
RESTART IDENTITY;

-- 6. Convert UUID columns to TEXT
ALTER TABLE public.profiles         ALTER COLUMN id          TYPE text USING id::text;
ALTER TABLE public.trips            ALTER COLUMN created_by  TYPE text USING created_by::text;
ALTER TABLE public.trip_members     ALTER COLUMN profile_id  TYPE text USING profile_id::text;
ALTER TABLE public.item_claims      ALTER COLUMN profile_id  TYPE text USING profile_id::text;
ALTER TABLE public.items            ALTER COLUMN created_by  TYPE text USING created_by::text;
ALTER TABLE public.trip_invitations ALTER COLUMN invited_by  TYPE text USING invited_by::text;
ALTER TABLE public.trip_invitations ALTER COLUMN accepted_by TYPE text USING accepted_by::text;
ALTER TABLE public.audit_events     ALTER COLUMN actor_id    TYPE text USING actor_id::text;

-- 7. Add org_id to trips (Clerk Organization = Group/Circle)
ALTER TABLE public.trips ADD COLUMN org_id text NOT NULL;
CREATE INDEX trips_org_id_idx ON public.trips(org_id);

-- 8. Recreate FKs (omit profiles -> auth.users; Clerk now owns identity)
ALTER TABLE public.trips
  ADD CONSTRAINT trips_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE RESTRICT;
ALTER TABLE public.trip_members
  ADD CONSTRAINT trip_members_profile_id_fkey
  FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.item_claims
  ADD CONSTRAINT item_claims_profile_id_fkey
  FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.items
  ADD CONSTRAINT items_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE RESTRICT;
ALTER TABLE public.trip_invitations
  ADD CONSTRAINT trip_invitations_invited_by_fkey
  FOREIGN KEY (invited_by) REFERENCES public.profiles(id) ON DELETE RESTRICT;
ALTER TABLE public.trip_invitations
  ADD CONSTRAINT trip_invitations_accepted_by_fkey
  FOREIGN KEY (accepted_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 9. Recreate helper functions with text user-id and JWT-aware org check
CREATE OR REPLACE FUNCTION public.is_platform_admin(uid text)
  RETURNS boolean
  LANGUAGE sql
  STABLE SECURITY DEFINER
  SET search_path = public, auth
AS $func$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = uid AND platform_role = 'super_admin'
  );
$func$;

CREATE OR REPLACE FUNCTION public.is_trip_member(t_id uuid, uid text)
  RETURNS boolean
  LANGUAGE sql
  STABLE SECURITY DEFINER
  SET search_path = public, auth
AS $func$
  SELECT EXISTS (
    SELECT 1 FROM public.trips t
    WHERE t.id = t_id
      AND (
        t.org_id = (auth.jwt() ->> 'org_id')
        OR EXISTS (
          SELECT 1 FROM public.trip_members tm
          WHERE tm.trip_id = t_id AND tm.profile_id = uid
        )
      )
  );
$func$;

CREATE OR REPLACE FUNCTION public.has_trip_role(t_id uuid, uid text, required trip_role)
  RETURNS boolean
  LANGUAGE sql
  STABLE SECURITY DEFINER
  SET search_path = public, auth
AS $func$
  SELECT CASE required
    WHEN 'viewer' THEN public.is_trip_member(t_id, uid)
    WHEN 'editor' THEN EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = t_id
        AND (
          t.org_id = (auth.jwt() ->> 'org_id')
          OR EXISTS (
            SELECT 1 FROM public.trip_members tm
            WHERE tm.trip_id = t_id AND tm.profile_id = uid
              AND tm.role IN ('editor','owner')
          )
        )
    )
    WHEN 'owner' THEN EXISTS (
      SELECT 1 FROM public.trip_members tm
      WHERE tm.trip_id = t_id AND tm.profile_id = uid AND tm.role = 'owner'
    )
    ELSE false
  END;
$func$;

-- 10. Recreate RLS policies with JWT-aware logic

-- profiles (profiles=b: any authenticated user can read any profile row)
CREATE POLICY profiles_select_public ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY profiles_update_self ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = (auth.jwt() ->> 'sub'))
  WITH CHECK (id = (auth.jwt() ->> 'sub'));

CREATE POLICY profiles_admin_insert ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    id = (auth.jwt() ->> 'sub')
    OR public.is_platform_admin((auth.jwt() ->> 'sub'))
  );

CREATE POLICY profiles_admin_delete ON public.profiles
  FOR DELETE TO authenticated
  USING (public.is_platform_admin((auth.jwt() ->> 'sub')));

-- destinations (global; admin write)
CREATE POLICY destinations_select_all ON public.destinations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY destinations_admin_insert ON public.destinations
  FOR INSERT TO authenticated
  WITH CHECK (public.is_platform_admin((auth.jwt() ->> 'sub')));

CREATE POLICY destinations_admin_update ON public.destinations
  FOR UPDATE TO authenticated
  USING (public.is_platform_admin((auth.jwt() ->> 'sub')))
  WITH CHECK (public.is_platform_admin((auth.jwt() ->> 'sub')));

CREATE POLICY destinations_admin_delete ON public.destinations
  FOR DELETE TO authenticated
  USING (public.is_platform_admin((auth.jwt() ->> 'sub')));

-- trips
CREATE POLICY trips_select_member ON public.trips
  FOR SELECT TO authenticated
  USING (
    org_id = (auth.jwt() ->> 'org_id')
    OR EXISTS (
      SELECT 1 FROM public.trip_members tm
      WHERE tm.trip_id = trips.id AND tm.profile_id = (auth.jwt() ->> 'sub')
    )
  );

CREATE POLICY trips_insert_creator ON public.trips
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = (auth.jwt() ->> 'sub')
    AND org_id = (auth.jwt() ->> 'org_id')
  );

CREATE POLICY trips_update_editor ON public.trips
  FOR UPDATE TO authenticated
  USING (
    org_id = (auth.jwt() ->> 'org_id')
    OR EXISTS (
      SELECT 1 FROM public.trip_members tm
      WHERE tm.trip_id = trips.id
        AND tm.profile_id = (auth.jwt() ->> 'sub')
        AND tm.role IN ('editor','owner')
    )
  )
  WITH CHECK (
    org_id = (auth.jwt() ->> 'org_id')
    OR EXISTS (
      SELECT 1 FROM public.trip_members tm
      WHERE tm.trip_id = trips.id
        AND tm.profile_id = (auth.jwt() ->> 'sub')
        AND tm.role IN ('editor','owner')
    )
  );

CREATE POLICY trips_delete_owner ON public.trips
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_members tm
      WHERE tm.trip_id = trips.id
        AND tm.profile_id = (auth.jwt() ->> 'sub')
        AND tm.role = 'owner'
    )
  );

-- trip_members
CREATE POLICY trip_members_select ON public.trip_members
  FOR SELECT TO authenticated
  USING (public.is_trip_member(trip_id, (auth.jwt() ->> 'sub')));

CREATE POLICY trip_members_owner_insert ON public.trip_members
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trip_members tm
      WHERE tm.trip_id = trip_members.trip_id
        AND tm.profile_id = (auth.jwt() ->> 'sub')
        AND tm.role = 'owner'
    )
  );

CREATE POLICY trip_members_owner_update ON public.trip_members
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_members tm
      WHERE tm.trip_id = trip_members.trip_id
        AND tm.profile_id = (auth.jwt() ->> 'sub')
        AND tm.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trip_members tm
      WHERE tm.trip_id = trip_members.trip_id
        AND tm.profile_id = (auth.jwt() ->> 'sub')
        AND tm.role = 'owner'
    )
  );

CREATE POLICY trip_members_owner_delete ON public.trip_members
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_members tm
      WHERE tm.trip_id = trip_members.trip_id
        AND tm.profile_id = (auth.jwt() ->> 'sub')
        AND tm.role = 'owner'
    )
  );

-- categories
CREATE POLICY categories_select ON public.categories
  FOR SELECT TO authenticated
  USING (public.is_trip_member(trip_id, (auth.jwt() ->> 'sub')));

CREATE POLICY categories_insert ON public.categories
  FOR INSERT TO authenticated
  WITH CHECK (public.has_trip_role(trip_id, (auth.jwt() ->> 'sub'), 'editor'));

CREATE POLICY categories_update ON public.categories
  FOR UPDATE TO authenticated
  USING (public.has_trip_role(trip_id, (auth.jwt() ->> 'sub'), 'editor'))
  WITH CHECK (public.has_trip_role(trip_id, (auth.jwt() ->> 'sub'), 'editor'));

CREATE POLICY categories_delete ON public.categories
  FOR DELETE TO authenticated
  USING (public.has_trip_role(trip_id, (auth.jwt() ->> 'sub'), 'editor'));

-- items
CREATE POLICY items_select ON public.items
  FOR SELECT TO authenticated
  USING (public.is_trip_member(trip_id, (auth.jwt() ->> 'sub')));

CREATE POLICY items_insert ON public.items
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_trip_role(trip_id, (auth.jwt() ->> 'sub'), 'editor')
    AND created_by = (auth.jwt() ->> 'sub')
  );

CREATE POLICY items_update ON public.items
  FOR UPDATE TO authenticated
  USING (public.has_trip_role(trip_id, (auth.jwt() ->> 'sub'), 'editor'))
  WITH CHECK (public.has_trip_role(trip_id, (auth.jwt() ->> 'sub'), 'editor'));

CREATE POLICY items_delete ON public.items
  FOR DELETE TO authenticated
  USING (public.has_trip_role(trip_id, (auth.jwt() ->> 'sub'), 'editor'));

-- item_claims
CREATE POLICY item_claims_select ON public.item_claims
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.items i
      WHERE i.id = item_claims.item_id
        AND public.is_trip_member(i.trip_id, (auth.jwt() ->> 'sub'))
    )
  );

CREATE POLICY item_claims_insert ON public.item_claims
  FOR INSERT TO authenticated
  WITH CHECK (
    profile_id = (auth.jwt() ->> 'sub')
    AND EXISTS (
      SELECT 1 FROM public.items i
      WHERE i.id = item_claims.item_id
        AND public.is_trip_member(i.trip_id, (auth.jwt() ->> 'sub'))
    )
  );

CREATE POLICY item_claims_update ON public.item_claims
  FOR UPDATE TO authenticated
  USING (profile_id = (auth.jwt() ->> 'sub'))
  WITH CHECK (profile_id = (auth.jwt() ->> 'sub'));

CREATE POLICY item_claims_delete ON public.item_claims
  FOR DELETE TO authenticated
  USING (profile_id = (auth.jwt() ->> 'sub'));

-- trip_invitations
CREATE POLICY invitations_owner ON public.trip_invitations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_members tm
      WHERE tm.trip_id = trip_invitations.trip_id
        AND tm.profile_id = (auth.jwt() ->> 'sub')
        AND tm.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trip_members tm
      WHERE tm.trip_id = trip_invitations.trip_id
        AND tm.profile_id = (auth.jwt() ->> 'sub')
        AND tm.role = 'owner'
    )
  );

-- audit_events
CREATE POLICY audit_events_select_member ON public.audit_events
  FOR SELECT TO authenticated
  USING (public.is_trip_member(trip_id, (auth.jwt() ->> 'sub')));

-- 11. Trigger: auto-create owner trip_members row on trip insert
CREATE OR REPLACE FUNCTION public.handle_new_trip()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $func$
BEGIN
  INSERT INTO public.trip_members (trip_id, profile_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$func$;

CREATE TRIGGER trips_create_owner_member
  AFTER INSERT ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_trip();
