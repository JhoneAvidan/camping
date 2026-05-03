REVOKE EXECUTE ON FUNCTION public.has_trip_role(uuid, uuid, public.trip_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_platform_admin(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_trip_member(uuid, uuid) FROM anon, authenticated, public;
