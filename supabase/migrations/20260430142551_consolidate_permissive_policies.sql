-- ============================================================
-- profiles: merge admin_all into per-action policies
-- ============================================================
DROP POLICY IF EXISTS profiles_admin_all ON public.profiles;
DROP POLICY IF EXISTS profiles_select_public ON public.profiles;
DROP POLICY IF EXISTS profiles_update_self ON public.profiles;

-- SELECT: public read for any authenticated user (admin trivially included).
CREATE POLICY profiles_select_public ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

-- UPDATE: self can update non-role columns; admin can update anything.
CREATE POLICY profiles_update_self ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    id = (select auth.uid())
    OR (select public.is_platform_admin((select auth.uid())))
  )
  WITH CHECK (
    (
      id = (select auth.uid())
      AND platform_role = (
        SELECT profiles_1.platform_role
        FROM public.profiles profiles_1
        WHERE profiles_1.id = (select auth.uid())
      )
    )
    OR (select public.is_platform_admin((select auth.uid())))
  );

-- INSERT/DELETE: admin only (previously covered by profiles_admin_all).
CREATE POLICY profiles_admin_insert ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK ((select public.is_platform_admin((select auth.uid()))));

CREATE POLICY profiles_admin_delete ON public.profiles
  FOR DELETE TO authenticated
  USING ((select public.is_platform_admin((select auth.uid()))));

-- ============================================================
-- destinations: keep public select (with admin OR), split admin write
-- ============================================================
DROP POLICY IF EXISTS destinations_admin_write ON public.destinations;
DROP POLICY IF EXISTS destinations_select_all ON public.destinations;

-- SELECT: active rows for everyone, all rows for admin (single permissive).
CREATE POLICY destinations_select_all ON public.destinations
  FOR SELECT TO authenticated
  USING (is_active OR (select public.is_platform_admin((select auth.uid()))));

-- INSERT/UPDATE/DELETE: admin only (split from prior FOR ALL).
CREATE POLICY destinations_admin_insert ON public.destinations
  FOR INSERT TO authenticated
  WITH CHECK ((select public.is_platform_admin((select auth.uid()))));

CREATE POLICY destinations_admin_update ON public.destinations
  FOR UPDATE TO authenticated
  USING ((select public.is_platform_admin((select auth.uid()))))
  WITH CHECK ((select public.is_platform_admin((select auth.uid()))));

CREATE POLICY destinations_admin_delete ON public.destinations
  FOR DELETE TO authenticated
  USING ((select public.is_platform_admin((select auth.uid()))));

-- ============================================================
-- categories: merge admin_global into select/write per action
-- ============================================================
DROP POLICY IF EXISTS categories_admin_global ON public.categories;
DROP POLICY IF EXISTS categories_select ON public.categories;
DROP POLICY IF EXISTS categories_write_editor ON public.categories;

-- SELECT: global rows (trip_id IS NULL), trip members, or admin.
CREATE POLICY categories_select ON public.categories
  FOR SELECT TO authenticated
  USING (
    trip_id IS NULL
    OR (select public.is_trip_member(trip_id, (select auth.uid())))
    OR (select public.is_platform_admin((select auth.uid())))
  );

-- INSERT: editors of the trip, or admin.
CREATE POLICY categories_insert ON public.categories
  FOR INSERT TO authenticated
  WITH CHECK (
    (trip_id IS NOT NULL AND (select public.has_trip_role(trip_id, (select auth.uid()), 'editor'::public.trip_role)))
    OR (select public.is_platform_admin((select auth.uid())))
  );

-- UPDATE: editors of the trip, or admin.
CREATE POLICY categories_update ON public.categories
  FOR UPDATE TO authenticated
  USING (
    (trip_id IS NOT NULL AND (select public.has_trip_role(trip_id, (select auth.uid()), 'editor'::public.trip_role)))
    OR (select public.is_platform_admin((select auth.uid())))
  )
  WITH CHECK (
    (trip_id IS NOT NULL AND (select public.has_trip_role(trip_id, (select auth.uid()), 'editor'::public.trip_role)))
    OR (select public.is_platform_admin((select auth.uid())))
  );

-- DELETE: editors of the trip, or admin.
CREATE POLICY categories_delete ON public.categories
  FOR DELETE TO authenticated
  USING (
    (trip_id IS NOT NULL AND (select public.has_trip_role(trip_id, (select auth.uid()), 'editor'::public.trip_role)))
    OR (select public.is_platform_admin((select auth.uid())))
  );

-- ============================================================
-- items: split items_write_editor (FOR ALL) so SELECT keeps single permissive
-- ============================================================
DROP POLICY IF EXISTS items_select ON public.items;
DROP POLICY IF EXISTS items_write_editor ON public.items;

-- SELECT: trip member or admin (admin already implicit via is_trip_member?
-- it's an explicit OR in the original; preserve it).
CREATE POLICY items_select ON public.items
  FOR SELECT TO authenticated
  USING (
    (select public.is_trip_member(trip_id, (select auth.uid())))
    OR (select public.is_platform_admin((select auth.uid())))
  );

-- INSERT: editor + creator must equal current user.
CREATE POLICY items_insert ON public.items
  FOR INSERT TO authenticated
  WITH CHECK (
    (select public.has_trip_role(trip_id, (select auth.uid()), 'editor'::public.trip_role))
    AND created_by = (select auth.uid())
  );

-- UPDATE: editor; WITH CHECK preserves creator-pin from original.
CREATE POLICY items_update ON public.items
  FOR UPDATE TO authenticated
  USING ((select public.has_trip_role(trip_id, (select auth.uid()), 'editor'::public.trip_role)))
  WITH CHECK (
    (select public.has_trip_role(trip_id, (select auth.uid()), 'editor'::public.trip_role))
    AND created_by = (select auth.uid())
  );

-- DELETE: editor.
CREATE POLICY items_delete ON public.items
  FOR DELETE TO authenticated
  USING ((select public.has_trip_role(trip_id, (select auth.uid()), 'editor'::public.trip_role)));

-- ============================================================
-- item_claims: merge self-write + editor-override + select
-- ============================================================
DROP POLICY IF EXISTS item_claims_select ON public.item_claims;
DROP POLICY IF EXISTS item_claims_self_write ON public.item_claims;
DROP POLICY IF EXISTS item_claims_editor_override ON public.item_claims;

-- SELECT: trip member or admin (via parent item).
CREATE POLICY item_claims_select ON public.item_claims
  FOR SELECT TO authenticated
  USING (
    profile_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.items i
      WHERE i.id = item_claims.item_id
        AND (
          (select public.is_trip_member(i.trip_id, (select auth.uid())))
          OR (select public.is_platform_admin((select auth.uid())))
          OR (select public.has_trip_role(i.trip_id, (select auth.uid()), 'editor'::public.trip_role))
        )
    )
  );

-- INSERT: self-claim or editor of the parent trip.
CREATE POLICY item_claims_insert ON public.item_claims
  FOR INSERT TO authenticated
  WITH CHECK (
    profile_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.items i
      WHERE i.id = item_claims.item_id
        AND (select public.has_trip_role(i.trip_id, (select auth.uid()), 'editor'::public.trip_role))
    )
  );

-- UPDATE: self-claim or editor of the parent trip.
CREATE POLICY item_claims_update ON public.item_claims
  FOR UPDATE TO authenticated
  USING (
    profile_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.items i
      WHERE i.id = item_claims.item_id
        AND (select public.has_trip_role(i.trip_id, (select auth.uid()), 'editor'::public.trip_role))
    )
  )
  WITH CHECK (
    profile_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.items i
      WHERE i.id = item_claims.item_id
        AND (select public.has_trip_role(i.trip_id, (select auth.uid()), 'editor'::public.trip_role))
    )
  );

-- DELETE: self-claim or editor of the parent trip.
CREATE POLICY item_claims_delete ON public.item_claims
  FOR DELETE TO authenticated
  USING (
    profile_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.items i
      WHERE i.id = item_claims.item_id
        AND (select public.has_trip_role(i.trip_id, (select auth.uid()), 'editor'::public.trip_role))
    )
  );

-- ============================================================
-- trip_members: split owner_write so SELECT keeps single permissive
-- ============================================================
DROP POLICY IF EXISTS trip_members_select ON public.trip_members;
DROP POLICY IF EXISTS trip_members_owner_write ON public.trip_members;

CREATE POLICY trip_members_select ON public.trip_members
  FOR SELECT TO authenticated
  USING (
    (select public.is_trip_member(trip_id, (select auth.uid())))
    OR (select public.is_platform_admin((select auth.uid())))
  );

CREATE POLICY trip_members_owner_insert ON public.trip_members
  FOR INSERT TO authenticated
  WITH CHECK (
    (select public.has_trip_role(trip_id, (select auth.uid()), 'owner'::public.trip_role))
    OR (select public.is_platform_admin((select auth.uid())))
  );

CREATE POLICY trip_members_owner_update ON public.trip_members
  FOR UPDATE TO authenticated
  USING (
    (select public.has_trip_role(trip_id, (select auth.uid()), 'owner'::public.trip_role))
    OR (select public.is_platform_admin((select auth.uid())))
  )
  WITH CHECK (
    (select public.has_trip_role(trip_id, (select auth.uid()), 'owner'::public.trip_role))
    OR (select public.is_platform_admin((select auth.uid())))
  );

CREATE POLICY trip_members_owner_delete ON public.trip_members
  FOR DELETE TO authenticated
  USING (
    (select public.has_trip_role(trip_id, (select auth.uid()), 'owner'::public.trip_role))
    OR (select public.is_platform_admin((select auth.uid())))
  );
