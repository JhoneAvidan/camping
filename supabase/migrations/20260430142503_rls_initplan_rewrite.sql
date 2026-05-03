-- profiles
DROP POLICY IF EXISTS profiles_update_self ON public.profiles;
CREATE POLICY profiles_update_self ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (
    id = (select auth.uid())
    AND platform_role = (
      SELECT profiles_1.platform_role
      FROM public.profiles profiles_1
      WHERE profiles_1.id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS profiles_admin_all ON public.profiles;
CREATE POLICY profiles_admin_all ON public.profiles
  FOR ALL TO authenticated
  USING ((select public.is_platform_admin((select auth.uid()))))
  WITH CHECK ((select public.is_platform_admin((select auth.uid()))));

-- destinations
DROP POLICY IF EXISTS destinations_select_all ON public.destinations;
CREATE POLICY destinations_select_all ON public.destinations
  FOR SELECT TO authenticated
  USING (is_active OR (select public.is_platform_admin((select auth.uid()))));

DROP POLICY IF EXISTS destinations_admin_write ON public.destinations;
CREATE POLICY destinations_admin_write ON public.destinations
  FOR ALL TO authenticated
  USING ((select public.is_platform_admin((select auth.uid()))))
  WITH CHECK ((select public.is_platform_admin((select auth.uid()))));

-- categories
DROP POLICY IF EXISTS categories_select ON public.categories;
CREATE POLICY categories_select ON public.categories
  FOR SELECT TO authenticated
  USING (
    trip_id IS NULL
    OR (select public.is_trip_member(trip_id, (select auth.uid())))
    OR (select public.is_platform_admin((select auth.uid())))
  );

DROP POLICY IF EXISTS categories_write_editor ON public.categories;
CREATE POLICY categories_write_editor ON public.categories
  FOR ALL TO authenticated
  USING (
    trip_id IS NOT NULL
    AND (select public.has_trip_role(trip_id, (select auth.uid()), 'editor'::public.trip_role))
  )
  WITH CHECK (
    trip_id IS NOT NULL
    AND (select public.has_trip_role(trip_id, (select auth.uid()), 'editor'::public.trip_role))
  );

DROP POLICY IF EXISTS categories_admin_global ON public.categories;
CREATE POLICY categories_admin_global ON public.categories
  FOR ALL TO authenticated
  USING ((select public.is_platform_admin((select auth.uid()))))
  WITH CHECK ((select public.is_platform_admin((select auth.uid()))));

-- trips
DROP POLICY IF EXISTS trips_select_member ON public.trips;
CREATE POLICY trips_select_member ON public.trips
  FOR SELECT TO authenticated
  USING (
    (select public.is_trip_member(id, (select auth.uid())))
    OR (select public.is_platform_admin((select auth.uid())))
  );

DROP POLICY IF EXISTS trips_insert_creator ON public.trips;
CREATE POLICY trips_insert_creator ON public.trips
  FOR INSERT TO authenticated
  WITH CHECK (created_by = (select auth.uid()));

DROP POLICY IF EXISTS trips_update_editor ON public.trips;
CREATE POLICY trips_update_editor ON public.trips
  FOR UPDATE TO authenticated
  USING ((select public.has_trip_role(id, (select auth.uid()), 'editor'::public.trip_role)))
  WITH CHECK ((select public.has_trip_role(id, (select auth.uid()), 'editor'::public.trip_role)));

DROP POLICY IF EXISTS trips_delete_owner ON public.trips;
CREATE POLICY trips_delete_owner ON public.trips
  FOR DELETE TO authenticated
  USING (
    (select public.has_trip_role(id, (select auth.uid()), 'owner'::public.trip_role))
    OR (select public.is_platform_admin((select auth.uid())))
  );

-- trip_members
DROP POLICY IF EXISTS trip_members_select ON public.trip_members;
CREATE POLICY trip_members_select ON public.trip_members
  FOR SELECT TO authenticated
  USING (
    (select public.is_trip_member(trip_id, (select auth.uid())))
    OR (select public.is_platform_admin((select auth.uid())))
  );

DROP POLICY IF EXISTS trip_members_owner_write ON public.trip_members;
CREATE POLICY trip_members_owner_write ON public.trip_members
  FOR ALL TO authenticated
  USING (
    (select public.has_trip_role(trip_id, (select auth.uid()), 'owner'::public.trip_role))
    OR (select public.is_platform_admin((select auth.uid())))
  )
  WITH CHECK (
    (select public.has_trip_role(trip_id, (select auth.uid()), 'owner'::public.trip_role))
    OR (select public.is_platform_admin((select auth.uid())))
  );

-- items
DROP POLICY IF EXISTS items_select ON public.items;
CREATE POLICY items_select ON public.items
  FOR SELECT TO authenticated
  USING (
    (select public.is_trip_member(trip_id, (select auth.uid())))
    OR (select public.is_platform_admin((select auth.uid())))
  );

DROP POLICY IF EXISTS items_write_editor ON public.items;
CREATE POLICY items_write_editor ON public.items
  FOR ALL TO authenticated
  USING ((select public.has_trip_role(trip_id, (select auth.uid()), 'editor'::public.trip_role)))
  WITH CHECK (
    (select public.has_trip_role(trip_id, (select auth.uid()), 'editor'::public.trip_role))
    AND created_by = (select auth.uid())
  );

-- item_claims
DROP POLICY IF EXISTS item_claims_select ON public.item_claims;
CREATE POLICY item_claims_select ON public.item_claims
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.items i
      WHERE i.id = item_claims.item_id
        AND (
          (select public.is_trip_member(i.trip_id, (select auth.uid())))
          OR (select public.is_platform_admin((select auth.uid())))
        )
    )
  );

DROP POLICY IF EXISTS item_claims_self_write ON public.item_claims;
CREATE POLICY item_claims_self_write ON public.item_claims
  FOR ALL TO authenticated
  USING (profile_id = (select auth.uid()))
  WITH CHECK (profile_id = (select auth.uid()));

DROP POLICY IF EXISTS item_claims_editor_override ON public.item_claims;
CREATE POLICY item_claims_editor_override ON public.item_claims
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.items i
      WHERE i.id = item_claims.item_id
        AND (select public.has_trip_role(i.trip_id, (select auth.uid()), 'editor'::public.trip_role))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.items i
      WHERE i.id = item_claims.item_id
        AND (select public.has_trip_role(i.trip_id, (select auth.uid()), 'editor'::public.trip_role))
    )
  );

-- trip_invitations
DROP POLICY IF EXISTS invitations_owner ON public.trip_invitations;
CREATE POLICY invitations_owner ON public.trip_invitations
  FOR ALL TO authenticated
  USING (
    (select public.has_trip_role(trip_id, (select auth.uid()), 'owner'::public.trip_role))
    OR (select public.is_platform_admin((select auth.uid())))
  )
  WITH CHECK (
    (select public.has_trip_role(trip_id, (select auth.uid()), 'owner'::public.trip_role))
  );

-- audit_events
DROP POLICY IF EXISTS audit_events_select_member ON public.audit_events;
CREATE POLICY audit_events_select_member ON public.audit_events
  FOR SELECT TO authenticated
  USING (
    (trip_id IS NOT NULL AND (select public.is_trip_member(trip_id, (select auth.uid()))))
    OR (select public.is_platform_admin((select auth.uid())))
  );
